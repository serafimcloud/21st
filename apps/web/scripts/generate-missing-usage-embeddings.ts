import { config } from "dotenv"
import { resolve } from "path"
import { readFileSync } from "fs"

// Load environment variables from .env.local
config({ path: resolve(__dirname, "../.env.local") })

// Then import the rest
const { Command } = require("commander")
const { supabaseWithAdminAccess } = require("../lib/supabase")
import OpenAI from "openai"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ANSI colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
}

// Custom logger with colors
const logger = {
  info: (message: string) =>
    console.log(`${colors.blue}INFO:${colors.reset} ${message}`),
  success: (message: string) =>
    console.log(`${colors.green}SUCCESS:${colors.reset} ${message}`),
  warn: (message: string) =>
    console.log(`${colors.yellow}WARNING:${colors.reset} ${message}`),
  error: (message: string) =>
    console.log(`${colors.red}ERROR:${colors.reset} ${message}`),
  progress: (percent: number) =>
    console.log(`${colors.cyan}PROGRESS:${colors.reset} ${percent}%`),
  divider: () => console.log("-".repeat(80)),
}

// Use Supabase admin client
const supabase = supabaseWithAdminAccess

// Helper function to add delay between requests to avoid rate limits
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Generate embedding using OpenAI
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

    // Validate embedding length
    if (embedding.length !== 1536) {
      throw new Error(
        `Invalid embedding length: ${embedding.length}. Expected 1536.`,
      )
    }

    return embedding
  } catch (error: any) {
    logger.error(
      `Error generating embedding: ${error?.message || "Unknown error"}`,
    )
    throw error
  }
}

// Helper function to convert array to pgvector format
function formatEmbeddingForPgVector(embedding: number[]): string {
  return `[${embedding.join(",")}]`
}

// Check if component embeddings exist
const checkComponentEmbeddingsExist = async (componentId: number) => {
  const { data: usageEmbedding } = await supabase
    .from("usage_embeddings")
    .select("id")
    .eq("item_id", componentId)
    .eq("item_type", "component")
    .maybeSingle()

  return !!usageEmbedding
}

// Check if demo embeddings exist
const checkDemoEmbeddingsExist = async (demoId: number) => {
  const { data: usageEmbedding } = await supabase
    .from("usage_embeddings")
    .select("id")
    .eq("item_id", demoId)
    .eq("item_type", "demo")
    .maybeSingle()

  return !!usageEmbedding
}

// Main function to generate missing embeddings
async function generateMissingUsageEmbeddings() {
  logger.info("Starting to generate missing usage embeddings...")
  logger.divider()

  try {
    // Read missing embeddings from file
    const missingEmbeddings = JSON.parse(
      readFileSync(resolve(__dirname, "missing-embeddings.json"), "utf-8"),
    )

    if (!Array.isArray(missingEmbeddings) || missingEmbeddings.length === 0) {
      logger.info("No missing embeddings found in file")
      return
    }

    logger.info(`Found ${missingEmbeddings.length} items to process`)
    let processed = 0
    let successful = 0

    for (const item of missingEmbeddings) {
      try {
        // Generate embeddings via Edge Function
        const { data: response, error } = await supabase.functions.invoke(
          "generate-embeddings",
          {
            body: {
              type: item.type,
              id: item.id,
            },
          },
        )

        if (error || !response?.data?.usage_description) {
          throw new Error(error?.message || "No usage description generated")
        }

        // Generate new embedding
        const newEmbedding = await generateEmbedding(
          response.data.usage_description,
        )

        // Format embedding for pgvector
        const vectorEmbedding = formatEmbeddingForPgVector(newEmbedding)

        // Insert into usage_embeddings table
        const { error: insertError } = await supabase.rpc("insert_embedding", {
          p_item_id: item.id,
          p_item_type: item.type,
          p_embedding: vectorEmbedding,
          p_usage_description: response.data.usage_description,
          p_metadata: response.data.metadata || {},
        })

        if (insertError) throw insertError

        successful++
        logger.success(
          `Successfully generated embedding for ${item.type} ${item.name || item.id}`,
        )

        const preview =
          response.data.usage_description.substring(0, 200) +
          (response.data.usage_description.length > 200 ? "..." : "")
        logger.info(`Generated description:\n${preview}`)
      } catch (error: any) {
        logger.error(
          `Error processing ${item.type} ${item.name || item.id}: ${error?.message || String(error)}`,
        )
      }

      processed++
      logger.progress(Math.floor((processed / missingEmbeddings.length) * 100))
      await sleep(500)
    }

    logger.divider()
    logger.success(
      `Completed embedding generation. Successfully processed ${successful} of ${missingEmbeddings.length} items.`,
    )
  } catch (error: any) {
    logger.error(
      `Error generating missing embeddings: ${error?.message || String(error)}`,
    )
  }
}

// Run the program
const run = async () => {
  try {
    logger.divider()
    logger.info("Starting missing embeddings generation...")
    logger.divider()

    await generateMissingUsageEmbeddings()

    logger.divider()
    logger.success("Missing embeddings generation completed!")
  } catch (error: any) {
    logger.error(`Error running the script: ${error?.message || String(error)}`)
    process.exit(1)
  }
}

run()
