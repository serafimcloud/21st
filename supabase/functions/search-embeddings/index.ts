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

const anthropic = new Anthropic({
  apiKey: claudeConfig.apiKey || Deno.env.get("ANTHROPIC_API_KEY"),
})

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const supabase = createClient(supabaseUrl, supabaseKey)

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
      model: openaiConfig.embeddingModel,
      input: text,
    })

    return response.data[0].embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    throw error
  }
}

/**
 * Generate a hypothetical document based on the query using HyDE technique
 */
async function generateHypotheticalDocument(
  query: string,
): Promise<{ componentCode: string; demoCode: string; fullDocument: string }> {
  try {
    console.log("Generating hypothetical document for query:", query)

    // Prepare prompt with the user's query
    const hydePrompt = HYDE_PROMPT.replace("{query}", query)

    // Generate hypothetical document using Claude
    const response = await anthropic.messages.create({
      model: claudeConfig.model,
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: hydePrompt,
        },
      ],
    })

    const hydeDocument = response.content[0].text
    console.log(
      "Generated hypothetical document:",
      hydeDocument.substring(0, 100) + "...",
    )

    // Try to parse the JSON response
    try {
      const hydeJson = JSON.parse(hydeDocument)

      // Extract component and demo code
      const componentCode = hydeJson.componentCode || ""
      const demoCode = hydeJson.demoCode || ""

      // Create a combined document for general search
      const fullDocument = `
        Component: ${hydeJson.componentName || ""}
        Description: ${hydeJson.componentDescription || ""}
        Features: ${(hydeJson.keyFeatures || []).join(", ")}
        Use Cases: ${(hydeJson.useCases || []).join(", ")}
      `.trim()

      return {
        componentCode,
        demoCode,
        fullDocument,
      }
    } catch (parseError) {
      console.warn(
        "Failed to parse HyDE JSON response, using as plain text:",
        parseError,
      )
      // Fallback: use the entire document as both component and demo code
      return {
        componentCode: hydeDocument,
        demoCode: hydeDocument,
        fullDocument: hydeDocument,
      }
    }
  } catch (error) {
    console.error("Error generating hypothetical document:", error)
    // Fallback to the original query for all fields
    return {
      componentCode: query,
      demoCode: query,
      fullDocument: query,
    }
  }
}

/**
 * Compute similarity score between two embedding vectors
 */
function computeSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error(
      `Embedding dimensions don't match: ${embedding1.length} vs ${embedding2.length}`,
    )
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
    itemTypes = ["component", "demo"],
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
  query: string,
  searchType: string = "combined",
) {
  console.log(`Searching for: ${query}, search type: ${searchType}`)

  // Generate hypothetical document based on query using HyDE
  const hydeDocuments = await generateHypotheticalDocument(query)

  // Generate embeddings for query and hypothetical documents
  const queryEmbedding = await generateEmbedding(query)
  const hydeComponentEmbedding = await generateEmbedding(
    hydeDocuments.componentCode,
  )
  const hydeDemoEmbedding = await generateEmbedding(hydeDocuments.demoCode)
  const hydeFullEmbedding = await generateEmbedding(hydeDocuments.fullDocument)

  let results: any[] = []

  // Search for components using both direct query and HyDE
  if (searchType === "combined" || searchType === "component") {
    // Use code embeddings to search for components by their code
    const componentCodeResults = await performVectorSearch(
      hydeComponentEmbedding,
      {
        table: "code_embeddings",
        itemTypes: ["component"],
        limit: 10,
        threshold: 0.65,
      },
    )

    // Use usage embeddings to search for components by their use cases
    const componentUsageResults = await performVectorSearch(hydeFullEmbedding, {
      table: "usage_embeddings",
      itemTypes: ["component"],
      limit: 10,
      threshold: 0.65,
    })

    // Get details for all component results
    const allComponentResults = [
      ...componentCodeResults,
      ...componentUsageResults,
    ]
    const enhancedComponentResults = await getItemDetails(allComponentResults)

    results.push(
      ...enhancedComponentResults.map((result) => ({
        ...result,
        search_type:
          result.item_type === "component" &&
          componentCodeResults.some((r) => r.item_id === result.item_id)
            ? "code_match"
            : "usage_match",
      })),
    )
  }

  // Search for demos using HyDE
  if (searchType === "combined" || searchType === "demo") {
    // Use code embeddings to search for demos by their code
    const demoCodeResults = await performVectorSearch(hydeDemoEmbedding, {
      table: "code_embeddings",
      itemTypes: ["demo"],
      limit: 10,
      threshold: 0.65,
    })

    // Use usage embeddings to search for demos by their use cases
    const demoUsageResults = await performVectorSearch(hydeFullEmbedding, {
      table: "usage_embeddings",
      itemTypes: ["demo"],
      limit: 10,
      threshold: 0.65,
    })

    // Get details for all demo results
    const allDemoResults = [...demoCodeResults, ...demoUsageResults]
    const enhancedDemoResults = await getItemDetails(allDemoResults)

    results.push(
      ...enhancedDemoResults.map((result) => ({
        ...result,
        search_type:
          result.item_type === "demo" &&
          demoCodeResults.some((r) => r.item_id === result.item_id)
            ? "code_match"
            : "usage_match",
      })),
    )
  }

  // Apply MMR to all results for diversity
  results = await maximalMarginalRelevance(
    queryEmbedding,
    results.map((r) => ({
      id: r.item_id,
      embedding: r.embedding,
      score: r.similarity,
    })),
    0.7,
    15,
  )
    .map((id) => results.find((r) => r.item_id === id))
    .filter(Boolean)

  return {
    results,
    query,
    hyde_documents: {
      component_code: hydeDocuments.componentCode.substring(0, 500) + "...",
      demo_code: hydeDocuments.demoCode.substring(0, 500) + "...",
    },
  }
}

// Server handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { query, searchType = "combined" } = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Missing required field: query" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || ""

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    })

    // Search components
    const results = await searchComponents(supabase, query, searchType)

    // Return search results
    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error in search-embeddings function:", error)

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
