import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import "https://deno.land/x/xhr@0.3.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4.86.1"
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.39.0"
import {
  claudeConfig,
  openaiConfig,
  HYDE_PROMPT,
} from "../generate-embeddings/ai-config.ts"

// Configure CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

// Initialize OpenAI client for embeddings
const openai = new OpenAI({
  apiKey: openaiConfig.apiKey || Deno.env.get("OPENAI_API_KEY"),
})

// Constants
const DEFAULT_SEARCH_LIMIT = 8
const MAX_SEARCH_LIMIT = 20
const MMR_LAMBDA = 0.5 // Balance between relevance and diversity (0.5 = equal weight)
const SIMILARITY_THRESHOLD = 0.75 // Minimum similarity score to include in results

/**
 * Generate embedding for search query
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    })

    if (!response.data?.[0]?.embedding) {
      throw new Error("No embedding returned from OpenAI")
    }

    const embedding = response.data[0].embedding

    // Remove the strict validation since we need to handle different dimensions
    // We'll validate dimension matching when comparing embeddings instead
    return embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    throw error
  }
}

/**
 * Generate a hypothetical document based on the query and user message using HyDE technique
 */
async function generateHypotheticalDocument(
  query: string,
  userMessage: string,
): Promise<{ searchQueries: string; fullDocument: string }> {
  try {
    console.log("Generating hypothetical search queries for:", query)
    console.log("User message:", userMessage)

    // Combine query and user message for better context
    const combinedInput = `Search Query: ${query}\nUser Request: ${userMessage}`

    // Generate search queries using GPT-4
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: HYDE_PROMPT,
        },
        {
          role: "user",
          content: combinedInput,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const hydeDocument = response.choices[0]?.message?.content || ""
    console.log(
      "Generated search queries:",
      hydeDocument.substring(0, 100) + "...",
    )

    // Clean up the generated queries
    const searchQueries = hydeDocument
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("-"))
      .join("\n")

    return {
      searchQueries,
      fullDocument: `${query}\n${userMessage}\n${searchQueries}`,
    }
  } catch (error) {
    console.error("Error generating search queries:", error)
    // Fallback to the original inputs
    return {
      searchQueries: `- ${query}\n- ${userMessage}`,
      fullDocument: `${query}\n${userMessage}`,
    }
  }
}

/**
 * Compute similarity score between two embedding vectors
 */
function computeSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    console.error(
      `Warning: Embedding dimensions don't match: ${embedding1.length} vs ${embedding2.length}`,
    )
    // Return a very low similarity score to effectively exclude this result
    return -1
  }

  // Compute dot product
  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i]
    norm1 += embedding1[i] * embedding1[i]
    norm2 += embedding2[i] * embedding2[i]
  }

  // Compute cosine similarity
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
}

/**
 * Maximal Marginal Relevance algorithm for diverse results
 */
function maximalMarginalRelevance(
  queryEmbedding: number[],
  candidateEmbeddings: { id: number; embedding: number[]; score: number }[],
  lambda: number = 0.5,
  k: number = DEFAULT_SEARCH_LIMIT,
): number[] {
  if (candidateEmbeddings.length <= k) {
    return candidateEmbeddings.map((item) => item.id)
  }

  // Initialize with most relevant item
  const selectedIds: number[] = [candidateEmbeddings[0].id]
  const selectedEmbeddings: number[][] = [candidateEmbeddings[0].embedding]

  // Remove the first item from candidates
  const remainingCandidates = candidateEmbeddings.slice(1)

  // Select k-1 more items
  while (selectedIds.length < k) {
    let nextBestId = -1
    let nextBestScore = -Infinity

    for (let i = 0; i < remainingCandidates.length; i++) {
      const candidate = remainingCandidates[i]

      // Relevance term (similarity to query)
      const relevance = candidate.score

      // Diversity term (negative max similarity to any selected item)
      let maxSimilarity = -Infinity
      for (const selectedEmbedding of selectedEmbeddings) {
        const similarity = computeSimilarity(
          candidate.embedding,
          selectedEmbedding,
        )
        maxSimilarity = Math.max(maxSimilarity, similarity)
      }

      // MMR score combines relevance and diversity
      const mmrScore = lambda * relevance - (1 - lambda) * maxSimilarity

      if (mmrScore > nextBestScore) {
        nextBestScore = mmrScore
        nextBestId = i
      }
    }

    // Add the next best item
    if (nextBestId !== -1) {
      selectedIds.push(remainingCandidates[nextBestId].id)
      selectedEmbeddings.push(remainingCandidates[nextBestId].embedding)
      remainingCandidates.splice(nextBestId, 1)
    } else {
      break // No more suitable candidates
    }
  }

  return selectedIds
}

/**
 * Perform vector search on the database
 */
async function performVectorSearch(
  embedding: number[],
  options: {
    limit?: number
    itemTypes?: string[]
    threshold?: number
    table: "usage_embeddings" | "code_embeddings"
  },
): Promise<any[]> {
  const {
    limit = DEFAULT_SEARCH_LIMIT,
    itemTypes = ["demo"],
    threshold = SIMILARITY_THRESHOLD,
    table,
  } = options

  // Construct filter based on item types
  const typeFilter =
    itemTypes.length > 0
      ? `item_type IN (${itemTypes.map((t) => `'${t}'`).join(",")})`
      : ""

  // Execute vector search query
  const { data, error } = await supabase.rpc("match_embeddings", {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: MAX_SEARCH_LIMIT, // Get more results than needed for MMR
    filter: typeFilter,
    table_name: table,
  })

  if (error) {
    console.error(`Error performing vector search on ${table}:`, error)
    throw error
  }

  // Handle empty results
  if (!data || data.length === 0) {
    return []
  }

  console.log(`Found ${data.length} results from ${table} search`)

  // Prepare data for MMR
  const candidateEmbeddings = data.map((item) => ({
    id: item.id,
    embedding: item.embedding,
    score: item.similarity,
  }))

  // Apply Maximal Marginal Relevance for diversity
  const selectedIds = maximalMarginalRelevance(
    embedding,
    candidateEmbeddings,
    MMR_LAMBDA,
    limit,
  )

  // Filter the original results to only include selected items
  const selectedResults = data.filter((item) => selectedIds.includes(item.id))

  return selectedResults
}

/**
 * Get item details from the database
 */
async function getItemDetails(results: any[]): Promise<any[]> {
  if (!results || results.length === 0) {
    return []
  }

  // Group results by item type
  const componentIds: number[] = []
  const demoIds: number[] = []

  results.forEach((result) => {
    if (result.item_type === "component") {
      componentIds.push(result.item_id)
    } else if (result.item_type === "demo") {
      demoIds.push(result.item_id)
    }
  })

  // Fetch component details
  let components: any[] = []
  if (componentIds.length > 0) {
    const { data, error } = await supabase
      .from("components")
      .select("id, name, code")
      .in("id", componentIds)

    if (error) {
      console.error("Error fetching component details:", error)
    } else if (data) {
      components = data
    }
  }

  // Fetch demo details
  let demos: any[] = []
  if (demoIds.length > 0) {
    const { data, error } = await supabase
      .from("demos")
      .select("id, name, demo_code, component_id")
      .in("id", demoIds)

    if (error) {
      console.error("Error fetching demo details:", error)
    } else if (data) {
      demos = data
    }
  }

  // Map details to results
  return results.map((result) => {
    let item = null

    if (result.item_type === "component") {
      item = components.find((c) => c.id === result.item_id)
    } else if (result.item_type === "demo") {
      item = demos.find((d) => d.id === result.item_id)
    }

    return {
      ...result,
      item_details: item || null,
    }
  })
}

/**
 * Main search function
 */
async function searchComponents(
  supabase: any,
  search: string,
  match_threshold: number = 0.33,
  userMessage: string = "",
) {
  console.log(
    `Searching for: ${search}, threshold: ${match_threshold}, user message: ${userMessage}`,
  )

  // Generate hypothetical document for better search context
  const hydeDocuments = await generateHypotheticalDocument(search, userMessage)

  // Get embedding for generated queries
  const hydeEmbedding = await generateEmbedding(hydeDocuments.searchQueries)

  // Search with embeddings using the new RPC function
  const { data: results, error } = await supabase.rpc("match_embeddings_with_details", {
    query_embedding: hydeEmbedding,
    match_threshold: match_threshold,
    match_count: 15
  })

  if (error) {
    throw error
  }

  return results
}

// Server handler
serve(async (req) => {
  // Initialize Supabase client with request authorization
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || ""
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: req.headers.get("Authorization")! },
    },
  })

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { search, match_threshold = 0.33, userMessage = "" } = await req.json()

    if (!search) {
      return new Response(
        JSON.stringify({ error: "Missing required field: search" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    if (match_threshold && (match_threshold < 0.1 || match_threshold > 0.99)) {
      return new Response(
        JSON.stringify({ error: "match_threshold must be between 0.1 and 0.99" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const results = await searchComponents(
      supabase,
      search,
      match_threshold,
      userMessage,
    )

    // Return results directly like in ai-search-oai
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error: unknown) {
    console.error("Error in search-embeddings function:", error)

    const errorMessage = error instanceof Error ? error.message : String(error)

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
