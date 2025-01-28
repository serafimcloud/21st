import { createClient } from "jsr:@supabase/supabase-js@2"
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const model = new Supabase.ai.Session("gte-small")

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

  const output = await model.run(search, { mean_pool: true, normalize: true })
  console.log("Embedding output:", output)

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    },
  )
  console.log("Supabase client initialized")

  const { data: searchResults, error } = await supabase.rpc("search_demos_ai", {
    search_query: search,
    query_embedding: JSON.stringify(output),
    match_threshold: match_threshold ?? 0.85,
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  console.log("Search results:", searchResults)

  return new Response(JSON.stringify(searchResults), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
