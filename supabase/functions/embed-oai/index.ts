import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts"
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts"

const databaseUrl = Deno.env.get("SUPABASE_DB_URL")

const pool = new Pool(databaseUrl, 1, true)

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
})

async function embedDemo(demoId: string) {
  console.log(`Starting to embed demo ${demoId}`)

  console.log("Connecting to database...")
  const connection = await pool.connect()

  console.log("Fetching demo data from database...")
  const result = await connection.queryObject`
   SELECT 
    c.name,
    c.description,
    c.code,
    d.name AS demo_name,
    d.demo_code,
    string_agg(t.name, ', ') AS tags
    FROM public.demos AS d
    INNER JOIN public.components AS c 
        ON d.component_id = c.id 
    LEFT JOIN public.demo_tags AS dt 
        ON d.id = dt.demo_id
    LEFT JOIN public.tags AS t 
        ON dt.tag_id = t.id
    WHERE d.id = ${demoId}
    GROUP BY c.id, d.id;
  `

  const data = result.rows[0] as {
    name: string
    description: string
    code: string
    demo_name: string
    demo_code: string
    tags: string
  }
  console.log("Demo data fetched successfully")

  // Structure the text to emphasize searchable fields and add semantic context
  const text = `${data.name}. ${data.demo_name}. ${data.description}. ${data.tags}`

  console.log("Generating embedding...")
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  })
  const output = embeddingResponse.data[0].embedding
  console.log("Embedding generated successfully")

  console.log("Updating demo with embedding...")
  await connection.queryObject`
    UPDATE public.demos
    SET embedding_oai = ${JSON.stringify(output)}
    WHERE id = ${demoId}
  `

  connection.release()
  console.log(`Successfully embedded demo ${demoId}`)
}

Deno.serve(async (req: Request) => {
  console.log("Received embedding request")
  // record is for the case when we send data from database webhooks
  const { demoId, record } = await req.json()
  console.log(`Processing demo ID or recrod: ${demoId} ${record}`)

  const idFromRecord = record?.id

  if (demoId && idFromRecord) {
    throw Error("Both demoId and record are provided")
  }

  const finalId = demoId ?? idFromRecord

  EdgeRuntime.waitUntil(embedDemo(finalId))

  return new Response("ok", {
    headers: {
      "Content-Type": "application/json",
      Connection: "keep-alive",
    },
  })
})
