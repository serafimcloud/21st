// Load environment variables first
const dotenv = require("dotenv")
const path = require("path")
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

// Then import the rest
const { Command } = require("commander")
const { supabaseWithAdminAccess } = require("../lib/supabase")

// ANSI colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
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

// Helper function to add delay between requests
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Check if component embeddings exist
const checkComponentEmbeddingsExist = async (componentId: number) => {
  // Check code embeddings
  const { data: codeEmbedding } = await supabase
    .from("code_embeddings")
    .select("id")
    .eq("item_id", componentId)
    .eq("item_type", "component")
    .maybeSingle()

  // Check usage embeddings
  const { data: usageEmbedding } = await supabase
    .from("usage_embeddings")
    .select("id")
    .eq("item_id", componentId)
    .eq("item_type", "component")
    .maybeSingle()

  return {
    codeExists: !!codeEmbedding,
    usageExists: !!usageEmbedding,
  }
}

// Check if demo embeddings exist
const checkDemoEmbeddingsExist = async (demoId: number) => {
  // Check code embeddings
  const { data: codeEmbedding } = await supabase
    .from("code_embeddings")
    .select("id")
    .eq("item_id", demoId)
    .eq("item_type", "demo")
    .maybeSingle()

  // Check usage embeddings
  const { data: usageEmbedding } = await supabase
    .from("usage_embeddings")
    .select("id")
    .eq("item_id", demoId)
    .eq("item_type", "demo")
    .maybeSingle()

  return {
    codeExists: !!codeEmbedding,
    usageExists: !!usageEmbedding,
  }
}

// Generate component embeddings
const generateComponentEmbeddings = async (
  type: "code" | "usage" | "both",
  force: boolean = false,
) => {
  logger.info(`Starting component ${type} embeddings generation...`)
  logger.divider()

  try {
    // Get all components
    const { data: components, error: componentsError } = await supabase
      .from("components")
      .select("id, name, code")
      .order("id")

    if (componentsError) throw componentsError

    if (!components || components.length === 0) {
      logger.warn("No components found for embedding generation")
      return
    }

    logger.info(`Found ${components.length} components to process`)

    let processed = 0
    let totalSuccesses = 0
    let skipped = 0

    for (const component of components) {
      logger.info(
        `[${type}] Processing ${component.name} (ID: ${component.id})...`,
      )

      try {
        // Check if embeddings already exist
        const { codeExists, usageExists } = await checkComponentEmbeddingsExist(
          component.id,
        )

        const shouldSkip =
          !force &&
          ((type === "code" && codeExists) ||
            (type === "usage" && usageExists) ||
            (type === "both" && codeExists && usageExists))

        if (shouldSkip) {
          logger.warn(
            `[${type}] Embeddings already exist for ${component.name}, skipping...`,
          )
          skipped++
          processed++
          logger.progress(Math.floor((processed / components.length) * 100))
          continue
        }

        // Generate embeddings
        await sleep(500)
        const { data: response, error } = await supabase.functions.invoke(
          "generate-embeddings",
          {
            body: {
              type: "component",
              id: component.id,
            },
          },
        )

        if (
          error &&
          (!error.message.includes(
            "Failed to send a request to the Edge Function",
          ) ||
            !response)
        ) {
          logger.error(
            `[${type}] Error generating embeddings for ${component.name}: ${error.message}`,
          )
          processed++
          logger.progress(Math.floor((processed / components.length) * 100))
          await sleep(2000)
          continue
        }

        totalSuccesses++
        logger.success(
          `[${type}] Successfully generated embeddings for ${component.name}`,
        )

        if (response?.data?.usage_description && type !== "code") {
          const preview =
            response.data.usage_description.substring(0, 200) +
            (response.data.usage_description.length > 200 ? "..." : "")
          logger.info(`[${type}] Generated description:\n${preview}`)
        }

        processed++
        logger.progress(Math.floor((processed / components.length) * 100))
      } catch (componentError: any) {
        logger.error(
          `[${type}] Exception while processing ${component.name}: ${componentError.message || String(componentError)}`,
        )
        logger.info(`[${type}] Continuing with next component after error...`)
        processed++
        logger.progress(Math.floor((processed / components.length) * 100))
        await sleep(2000)
      }
    }

    logger.divider()
    logger.success(
      `Completed component ${type} embedding generation. Successfully processed ${totalSuccesses} of ${processed} components. Skipped ${skipped} components with existing embeddings.`,
    )
  } catch (error: any) {
    logger.error(
      `Error generating component embeddings: ${error.message || String(error)}`,
    )
  }
}

// Generate demo embeddings
const generateDemoEmbeddings = async (
  type: "code" | "usage" | "both",
  force: boolean = false,
) => {
  logger.info(`Starting demo ${type} embeddings generation...`)
  logger.divider()

  try {
    // Get all demos
    const { data: demos, error: demosError } = await supabase
      .from("demos")
      .select("id, name, demo_code, component_id")
      .order("id")

    if (demosError) throw demosError

    if (!demos || demos.length === 0) {
      logger.warn("No demos found for embedding generation")
      return
    }

    logger.info(`Found ${demos.length} demos to process`)

    let processed = 0
    let totalSuccesses = 0
    let skipped = 0

    for (const demo of demos) {
      logger.info(
        `[${type}] Processing demo ${demo.name || "Unnamed"} (ID: ${demo.id})...`,
      )

      try {
        // Check if embeddings already exist
        const { codeExists, usageExists } = await checkDemoEmbeddingsExist(
          demo.id,
        )

        const shouldSkip =
          !force &&
          ((type === "code" && codeExists) ||
            (type === "usage" && usageExists) ||
            (type === "both" && codeExists && usageExists))

        if (shouldSkip) {
          logger.warn(
            `[${type}] Embeddings already exist for demo ${demo.id}, skipping...`,
          )
          skipped++
          processed++
          logger.progress(Math.floor((processed / demos.length) * 100))
          continue
        }

        // Generate embeddings
        await sleep(500)
        const { data: response, error } = await supabase.functions.invoke(
          "generate-embeddings",
          {
            body: {
              type: "demo",
              id: demo.id,
            },
          },
        )

        if (
          error &&
          (!error.message.includes(
            "Failed to send a request to the Edge Function",
          ) ||
            !response)
        ) {
          logger.error(
            `[${type}] Error generating embeddings for demo ${demo.id}: ${error.message}`,
          )
          processed++
          logger.progress(Math.floor((processed / demos.length) * 100))
          await sleep(2000)
          continue
        }

        totalSuccesses++
        logger.success(
          `[${type}] Successfully generated embeddings for demo ${demo.id}`,
        )

        if (response?.data?.usage_description && type !== "code") {
          const preview =
            response.data.usage_description.substring(0, 200) +
            (response.data.usage_description.length > 200 ? "..." : "")
          logger.info(`[${type}] Generated description:\n${preview}`)
        }

        processed++
        logger.progress(Math.floor((processed / demos.length) * 100))
      } catch (demoError: any) {
        logger.error(
          `[${type}] Exception while processing demo ${demo.id}: ${demoError.message || String(demoError)}`,
        )
        logger.info(`[${type}] Continuing with next demo after error...`)
        processed++
        logger.progress(Math.floor((processed / demos.length) * 100))
        await sleep(2000)
      }
    }

    logger.divider()
    logger.success(
      `Completed demo ${type} embedding generation. Successfully processed ${totalSuccesses} of ${processed} demos. Skipped ${skipped} demos with existing embeddings.`,
    )
  } catch (error: any) {
    logger.error(
      `Error generating demo embeddings: ${error.message || String(error)}`,
    )
  }
}

// Main CLI program
const program = new Command()

program
  .name("generate-embeddings")
  .description("Generate embeddings for components and demos")
  .version("1.0.0")

program
  .option(
    "-t, --type <type>",
    "Type of embeddings to generate: code, usage, or both",
    "both",
  )
  .option("-c, --components", "Generate embeddings for components")
  .option("-d, --demos", "Generate embeddings for demos")
  .option("-a, --all", "Generate embeddings for both components and demos")
  .option(
    "-f, --force",
    "Force regeneration of embeddings even if they already exist",
  )

program.parse(process.argv)

const options = program.opts()

// Validate options
if (!options.components && !options.demos && !options.all) {
  logger.error("You must specify either --components, --demos, or --all")
  process.exit(1)
}

// Validate embedding type
if (!["code", "usage", "both"].includes(options.type)) {
  logger.error("Type must be one of: code, usage, both")
  process.exit(1)
}

// Set up async function to run the program
const run = async () => {
  try {
    const embedType = options.type as "code" | "usage" | "both"
    const force = options.force || false

    logger.divider()
    logger.info(`Starting embedding generation with options:`)
    logger.info(`Type: ${embedType}`)
    logger.info(
      `Components: ${options.components || options.all ? "Yes" : "No"}`,
    )
    logger.info(`Demos: ${options.demos || options.all ? "Yes" : "No"}`)
    logger.info(`Force regeneration: ${force ? "Yes" : "No"}`)
    logger.divider()

    if (options.components || options.all) {
      await generateComponentEmbeddings(embedType, force)
    }

    if (options.demos || options.all) {
      await generateDemoEmbeddings(embedType, force)
    }

    logger.divider()
    logger.success("All embedding generation tasks completed!")
  } catch (error: any) {
    logger.error(`Error running the script: ${error.message || String(error)}`)
    process.exit(1)
  }
}

// Run the program
run()
