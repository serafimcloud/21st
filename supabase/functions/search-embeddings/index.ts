import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import "https://deno.land/x/xhr@0.3.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4.12.1"

// Configure CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

// Initialize OpenAI client for embeddings
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
})

/**
 * Generate embedding for search query
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
      dimensions: 1536, // explicit dimensions for consistency
    })

    return response.data[0].embedding
  } catch (error) {
    console.error("Error generating search query embedding:", error)
    throw error
  }
}

/**
 * Search for items by embedding similarity
 */
async function searchByEmbedding(
  supabase: any,
  queryEmbedding: number[],
  table: string,
  embeddingColumn: string = "embedding", // default column name
  embeddingType: string | null = null,
  threshold: number = 0.7,
  limit: number = 20,
) {
  // Prepare query to search by embedding similarity
  let query = supabase.rpc("match_embeddings", {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
    embedding_table: table,
    embedding_column: embeddingColumn,
  })

  // Apply embedding type filter if provided
  if (
    embeddingType &&
    (table === "component_embeddings" || table === "demo_embeddings")
  ) {
    query = query.eq("embedding_type", embeddingType)
  }

  const { data, error } = await query

  if (error) {
    console.error(`Error searching ${table}:`, error)
    return []
  }

  return data || []
}

/**
 * Apply Maximal Marginal Relevance (MMR) to rerank results for diversity
 */
function applyMMR(
  results: any[],
  queryEmbedding: number[],
  lambda: number = 0.7,
  k: number = 10,
) {
  if (results.length <= k) return results

  // Initialize selected and remaining sets
  let selected: any[] = []
  let remaining = [...results]

  // Select first item (highest similarity)
  // Выбираем первый самый релевантный результат
  let bestIdx = 0
  let bestSimilarity = remaining[0].similarity

  for (let i = 1; i < remaining.length; i++) {
    if (remaining[i].similarity > bestSimilarity) {
      bestSimilarity = remaining[i].similarity
      bestIdx = i
    }
  }

  selected.push(remaining[bestIdx])
  remaining.splice(bestIdx, 1)

  // Iteratively select the rest
  while (selected.length < k && remaining.length > 0) {
    let bestScore = -Infinity
    let bestIdx = -1

    for (let i = 0; i < remaining.length; i++) {
      // Relevance to query
      const queryRelevance = remaining[i].similarity

      // Find maximum similarity to already selected items
      let maxSimilarityToSelected = -Infinity
      for (const sel of selected) {
        // Here we would ideally compute cosine similarity between embeddings,
        // but for simplicity we use the difference in similarity scores
        const sim = Math.abs(remaining[i].similarity - sel.similarity)
        maxSimilarityToSelected = Math.max(maxSimilarityToSelected, sim)
      }

      // MMR formula: λ*relevance - (1-λ)*similarity
      const score =
        lambda * queryRelevance - (1 - lambda) * maxSimilarityToSelected

      if (score > bestScore) {
        bestScore = score
        bestIdx = i
      }
    }

    selected.push(remaining[bestIdx])
    remaining.splice(bestIdx, 1)
  }

  return selected
}

/**
 * Rank and group search results by type
 */
function rankAndGroupResults(results: any[]) {
  // Group results by type
  const grouped = {
    fullSolutions: results.filter((r) => r.type === "full_demo"),
    componentUsages: results.filter((r) => r.type === "component_usage"),
    versatileComponents: results.filter((r) => r.type === "component"),
  }

  return {
    fullSolutions: grouped.fullSolutions.slice(0, 3),
    contextualComponents: grouped.componentUsages.slice(0, 5),
    adaptableComponents: grouped.versatileComponents.slice(0, 3),
  }
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

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query)
  let results: any[] = []

  // Search different types of embeddings based on search type
  if (searchType === "combined" || searchType === "demo") {
    // Search for full demos matching the query
    const demoResults = await searchByEmbedding(
      supabase,
      queryEmbedding,
      "demo_embeddings",
      "embedding",
      "usage",
      0.7,
      10,
    )

    // Get demo details
    const demoIds = demoResults.map((r: any) => r.demo_id)

    if (demoIds.length > 0) {
      const { data: demoDetails, error: demoError } = await supabase
        .from("demos")
        .select(
          `
          id,
          name,
          demo_code,
          demo_slug,
          components:component_id (
            id,
            name
          )
        `,
        )
        .in("id", demoIds)

      if (!demoError && demoDetails) {
        // Combine results with details
        const enhancedDemoResults = demoResults.map((result: any) => {
          const details = demoDetails.find((d: any) => d.id === result.demo_id)
          return {
            ...result,
            demo_name: details?.name,
            demo_code: details?.demo_code,
            component_id: details?.components?.id,
            component_name: details?.components?.name,
            type: "full_demo",
          }
        })

        results.push(...enhancedDemoResults)
      }
    }
  }

  if (searchType === "combined" || searchType === "context") {
    // Search for usage contexts
    const contextResults = await searchByEmbedding(
      supabase,
      queryEmbedding,
      "usage_context_embeddings",
      "embedding",
      null,
      0.7,
      10,
    )

    // Enhance context results with names
    const enhancedContextResults = contextResults.map((result: any) => ({
      ...result,
      component_id: result.component_id,
      demo_id: result.demo_id,
      component_name: result.metadata?.component_name,
      demo_name: result.metadata?.demo_name,
      context_description: result.context_description,
      type: "component_usage",
    }))

    results.push(...enhancedContextResults)
  }

  if (searchType === "combined" || searchType === "component") {
    // Search for components by their capabilities
    const componentResults = await searchByEmbedding(
      supabase,
      queryEmbedding,
      "component_embeddings",
      "embedding",
      "capability",
      0.7,
      10,
    )

    // Get component details
    const componentIds = componentResults.map((r: any) => r.component_id)

    if (componentIds.length > 0) {
      const { data: componentDetails, error: componentError } = await supabase
        .from("components")
        .select("id, name, description")
        .in("id", componentIds)

      if (!componentError && componentDetails) {
        // Combine results with details
        const enhancedComponentResults = componentResults.map((result: any) => {
          const details = componentDetails.find(
            (c: any) => c.id === result.component_id,
          )
          return {
            ...result,
            component_id: result.component_id,
            component_name: details?.name,
            component_description: details?.description,
            enhanced_description: result.metadata?.description,
            type: "component",
          }
        })

        results.push(...enhancedComponentResults)
      }
    }
  }

  // Apply MMR to all results for diversity
  results = applyMMR(results, queryEmbedding, 0.7, 15)

  // Group results by type
  return rankAndGroupResults(results)
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
