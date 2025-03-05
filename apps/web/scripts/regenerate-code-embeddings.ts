import { config } from "dotenv"
import { resolve } from "path"
import fetch from "node-fetch"

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

// Helper function to fetch code from URL
async function fetchCodeFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch code: ${response.statusText}`)
    }
    return await response.text()
  } catch (error: any) {
    throw new Error(`Error fetching code: ${error.message}`)
  }
}

interface Component {
  id: number
  name: string
  code: string
}

interface Demo {
  id: number
  name: string
  demo_code: string
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

// Main function to regenerate code embeddings
async function regenerateCodeEmbeddings() {
  logger.info("Starting code embeddings regeneration...")
  logger.divider()

  try {
    // Get all components with code
    const { data: components, error: componentsError } = await supabase
      .from("components")
      .select("id, name, code")
      .not("code", "is", null)
      .order("id")

    if (componentsError) throw componentsError

    // Get all demos with code
    const { data: demos, error: demosError } = await supabase
      .from("demos")
      .select("id, name, demo_code")
      .not("demo_code", "is", null)
      .order("id")

    if (demosError) throw demosError

    // Process components
    const records = [
      ...(components || []).map((comp: Component) => ({
        id: crypto.randomUUID(),
        item_id: comp.id,
        item_type: "component",
        code_url: comp.code,
        metadata: { name: comp.name },
      })),
      ...(demos || []).map((demo: Demo) => ({
        id: crypto.randomUUID(),
        item_id: demo.id,
        item_type: "demo",
        code_url: demo.demo_code,
        metadata: { name: demo.name },
      })),
    ]

    if (records.length === 0) {
      logger.warn("No records found with code")
      return
    }

    logger.info(`Found ${records.length} records to process`)
    let processed = 0
    let successful = 0

    // Process each record
    for (const record of records) {
      try {
        // Fetch actual code from URL
        const code = await fetchCodeFromUrl(record.code_url)

        // Log first component details
        if (processed === 0) {
          logger.info("First record details:")
          logger.info(`Type: ${record.item_type}`)
          logger.info(`ID: ${record.item_id}`)
          logger.info(`Name: ${record.metadata.name}`)
          logger.info(`URL: ${record.code_url}`)
          logger.info("Code being sent to OpenAI:")
          console.log("-".repeat(80))
          console.log(code)
          console.log("-".repeat(80))
        }

        // Generate new embedding
        const newEmbedding = await generateEmbedding(code)

        // Format embedding for pgvector
        const vectorEmbedding = formatEmbeddingForPgVector(newEmbedding)

        // Insert into code_embeddings table
        const { error: insertError } = await supabase
          .from("code_embeddings")
          .upsert({
            id: record.id,
            item_id: record.item_id,
            item_type: record.item_type,
            embedding: vectorEmbedding,
            metadata: record.metadata,
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
      logger.progress(Math.floor((processed / records.length) * 100))

      // Small delay between requests to avoid rate limits
      await sleep(200)
    }

    logger.divider()
    logger.success(
      `Completed code embedding regeneration. Successfully processed ${successful} of ${records.length} records.`,
    )
  } catch (error: any) {
    logger.error(
      `Error regenerating code embeddings: ${error?.message || String(error)}`,
    )
  }
}

// Run the program
const run = async () => {
  try {
    logger.divider()
    logger.info("Starting code embedding regeneration...")
    logger.divider()

    await regenerateCodeEmbeddings()

    logger.divider()
    logger.success("Code embedding regeneration completed!")
  } catch (error: any) {
    logger.error(`Error running the script: ${error?.message || String(error)}`)
    process.exit(1)
  }
}

run()
