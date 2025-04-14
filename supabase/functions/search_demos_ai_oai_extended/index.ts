// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
})

console.log("Hello from Functions!")

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const { search, match_threshold } = await req.json()
  console.log("Search query:", search)

  if (match_threshold && (match_threshold < 0.1 || match_threshold > 0.99)) {
    return new Response(
      JSON.stringify({ error: "match_threshold must be between 0.1 and 0.99" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: search,
    encoding_format: "float",
  })
  const output = embeddingResponse.data[0].embedding
  console.log("Embedding output:", output)

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    },
  )
  console.log("Supabase client initialized")

  // Get the search results using the updated function
  const { data: searchResults, error } = await supabase.rpc(
    "search_demos_ai_oai_v2",
    {
      search_query: search,
      query_embedding: JSON.stringify(output),
      match_threshold: match_threshold ?? 0.33,
    },
  )

  if (error) {
    console.error("Search error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  console.log("Search results with user data:", searchResults)

  return new Response(JSON.stringify(searchResults), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/search_demos_ai_oai_extended' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
