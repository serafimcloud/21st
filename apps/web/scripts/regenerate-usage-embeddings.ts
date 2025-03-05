import { config } from "dotenv"
import { resolve } from "path"

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

interface BackupRecord {
  id: string
  item_id: number
  item_type: string
  usage_description: string
  metadata: Record<string, any>
}

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

// Main function to regenerate embeddings
async function regenerateUsageEmbeddings() {
  logger.info("Starting usage embeddings regeneration...")
  logger.divider()

  try {
    // Get all records from backup that have usage_description
    const { data: backupRecords, error: backupError } = await supabase
      .from("backup_usage_embeddings")
      .select("id, item_id, item_type, usage_description, metadata")
      .not("usage_description", "is", null)
      .order("id")

    if (backupError) throw backupError

    if (!backupRecords || backupRecords.length === 0) {
      logger.warn("No backup records found with usage descriptions")
      return
    }

    logger.info(`Found ${backupRecords.length} records to process`)
    let processed = 0
    let successful = 0

    // Process each record
    for (const record of backupRecords as BackupRecord[]) {
      try {
        // Generate new embedding
        const newEmbedding = await generateEmbedding(record.usage_description)

        // Format embedding for pgvector
        const vectorEmbedding = formatEmbeddingForPgVector(newEmbedding)

        // Insert into new table with proper vector format
        const { error: insertError } = await supabase.rpc("insert_embedding", {
          p_id: record.id,
          p_item_id: record.item_id,
          p_item_type: record.item_type,
          p_embedding: vectorEmbedding,
          p_usage_description: record.usage_description,
          p_metadata: record.metadata,
        })

        if (insertError) throw insertError

        successful++
        logger.success(
          `Successfully regenerated embedding for ${record.item_type} ${record.item_id}`,
        )
      } catch (error: any) {
        logger.error(
          `Error processing ${record.item_type} ${record.item_id}: ${error?.message || "Unknown error"}`,
        )
      }

      processed++
      logger.progress(Math.floor((processed / backupRecords.length) * 100))

      // Small delay between requests to avoid rate limits
      await sleep(200)
    }

    logger.divider()
    logger.success(
      `Completed usage embedding regeneration. Successfully processed ${successful} of ${backupRecords.length} records.`,
    )
  } catch (error: any) {
    logger.error(
      `Error regenerating usage embeddings: ${error?.message || String(error)}`,
    )
  }
}

// Run the program
const run = async () => {
  try {
    logger.divider()
    logger.info("Starting embedding regeneration...")
    logger.divider()

    await regenerateUsageEmbeddings()

    logger.divider()
    logger.success("Embedding regeneration completed!")
  } catch (error: any) {
    logger.error(`Error running the script: ${error?.message || String(error)}`)
    process.exit(1)
  }
}

run()
