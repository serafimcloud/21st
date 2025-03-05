import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import "https://deno.land/x/xhr@0.3.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4.86.1"
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.39.0"
import {
  claudeConfig,
  openaiConfig,
  USAGE_PROMPT,
  DEMO_PROMPT,
} from "./ai-config.ts"

// Initialize clients
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

// Helper to truncate code to fit in prompt
function trimCodeForPrompt(code: string, maxLength: number): string {
  if (!code || code.length <= maxLength) return code

  // Simple truncation approach
  return code.substring(0, maxLength) + "\n\n/* Code truncated for length */"
}

// Fetch code from URL if needed
async function fetchCodeFromUrl(codeOrUrl: string): Promise<string> {
  if (!codeOrUrl) return ""

  // Check if the code is a URL
  if (codeOrUrl.startsWith("http://") || codeOrUrl.startsWith("https://")) {
    try {
      console.log(`Fetching code from URL: ${codeOrUrl}`)
      const response = await fetch(codeOrUrl)
      if (!response.ok) {
        throw new Error(
          `Failed to fetch code: ${response.status} ${response.statusText}`,
        )
      }
      const code = await response.text()
      console.log(`Successfully fetched code (${code.length} chars)`)
      return code
    } catch (error) {
      console.error(`Error fetching code from URL: ${error.message}`)
      return `[Error fetching code: ${error.message}]`
    }
  }

  return codeOrUrl
}

// Generate embeddings using OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: openaiConfig.embeddingModel,
    input: text,
  })

  return response.data[0].embedding
}

// Generate usage description using Claude
async function generateUsageDescription(
  componentName: string,
  componentCode: string,
  demosText: string,
): Promise<string> {
  // Create prompt for Claude
  const prompt = `${USAGE_PROMPT}

Component Name: ${componentName}

Component Code:
${trimCodeForPrompt(componentCode, 4000)}

Component Demos:
${demosText || "No demos available"}`

  // Generate description using Claude
  try {
    const response = await anthropic.messages.create({
      model: claudeConfig.model,
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const usageDescription = response.content[0].text
    console.log(
      "Generated usage description:",
      usageDescription.substring(0, 200) + "...",
    )

    return usageDescription
  } catch (error) {
    console.error("Error generating usage description:", error)
    return `Error generating usage description: ${error.message}`
  }
}

// Generate embeddings for a component and its demos
async function generateComponentEmbeddings(componentId: number): Promise<any> {
  console.log(`Generating embeddings for component ID: ${componentId}`)

  try {
    // Fetch component data
    const { data: component, error: componentError } = await supabase
      .from("components")
      .select("id, name, code")
      .eq("id", componentId)
      .single()

    if (componentError || !component) {
      throw new Error(
        `Failed to fetch component: ${componentError?.message || "Component not found"}`,
      )
    }

    // Get component code (resolving URL if needed)
    const componentCode = await fetchCodeFromUrl(component.code || "")
    if (!componentCode || componentCode.length < 10) {
      throw new Error("Component code is missing or too short")
    }

    // 1. Generate usage-oriented search queries based ONLY on component code
    // We don't include demos here as per user request to avoid limiting model's understanding
    console.log(
      "Calling Claude to generate usage description for component only",
    )
    const usageDescription = await generateUsageDescription(
      component.name,
      componentCode,
      "", // No demos text - intentionally empty
    )

    // 2. Generate embedding for usage description
    const usageEmbedding = await generateEmbedding(usageDescription)

    // Store usage embedding
    const { data: usageData, error: usageError } = await supabase
      .from("usage_embeddings")
      .upsert({
        item_id: componentId,
        item_type: "component",
        embedding: usageEmbedding,
        usage_description: usageDescription,
        metadata: {
          name: component.name,
          component_id: componentId,
        },
      })
      .select("id")
      .single()

    if (usageError) {
      throw new Error(`Failed to store usage embedding: ${usageError.message}`)
    }

    // 3. Generate embedding for code
    const codeEmbedding = await generateEmbedding(componentCode)

    // Store code embedding
    const { data: codeData, error: codeError } = await supabase
      .from("code_embeddings")
      .upsert({
        item_id: componentId,
        item_type: "component",
        embedding: codeEmbedding,
        metadata: {
          name: component.name,
          code_preview: componentCode.substring(0, 200) + "...",
        },
      })
      .select("id")
      .single()

    if (codeError) {
      throw new Error(`Failed to store code embedding: ${codeError.message}`)
    }

    return {
      success: true,
      data: {
        usage_description: usageDescription,
        metadata: {
          name: component.name,
          component_id: componentId
        }
      }
    }
  } catch (error) {
    console.error(
      `Error generating embeddings for component ${componentId}:`,
      error,
    )
    return {
      success: false,
      component_id: componentId,
      error: error.message,
    }
  }
}

// Generate embeddings for a demo
async function generateDemoEmbedding(demoId: number): Promise<any> {
  console.log(`Generating embeddings for demo ID: ${demoId}`)

  try {
    // Fetch demo data
    const { data: demo, error: demoError } = await supabase
      .from("demos")
      .select("id, name, demo_code, component_id")
      .eq("id", demoId)
      .single()

    if (demoError || !demo) {
      throw new Error(
        `Failed to fetch demo: ${demoError?.message || "Demo not found"}`,
      )
    }

    // Get demo code (resolving URL if needed)
    const demoCode = await fetchCodeFromUrl(demo.demo_code || "")
    if (!demoCode || demoCode.length < 10) {
      throw new Error("Demo code is missing or too short")
    }

    // Fetch the component code to include it with the demo
    const { data: component, error: componentError } = await supabase
      .from("components")
      .select("code, name")
      .eq("id", demo.component_id)
      .single()

    if (componentError || !component) {
      throw new Error(
        `Failed to fetch component for demo: ${componentError?.message || "Component not found"}`,
      )
    }

    // Get component code (resolving URL if needed)
    const componentCode = await fetchCodeFromUrl(component.code || "")
    if (!componentCode || componentCode.length < 10) {
      throw new Error("Component code is missing or too short")
    }

    // Generate search queries for this specific demo implementation
    // Include both component code and demo code for better context
    const demoDescription = await generateDemoDescription(
      demo.name,
      demoCode,
      component.name,
      componentCode,
    )

    // Generate embedding for demo description (for usage search)
    const demoUsageEmbedding = await generateEmbedding(demoDescription)

    // Store in usage_embeddings
    const { data: usageData, error: usageError } = await supabase
      .from("usage_embeddings")
      .upsert({
        item_id: demoId,
        item_type: "demo",
        embedding: demoUsageEmbedding,
        usage_description: demoDescription,
        metadata: {
          name: demo.name,
          demo_id: demoId,
          component_id: demo.component_id,
          component_name: component.name,
        },
      })
      .select("id")
      .single()

    if (usageError) {
      throw new Error(
        `Failed to store demo usage embedding: ${usageError.message}`,
      )
    }

    // Generate embedding for demo code (for code search)
    const demoCodeEmbedding = await generateEmbedding(demoCode)

    // Store code embedding
    const { data: codeData, error: codeError } = await supabase
      .from("code_embeddings")
      .upsert({
        item_id: demoId,
        item_type: "demo",
        embedding: demoCodeEmbedding,
        metadata: {
          name: demo.name,
          demo_id: demoId,
          component_id: demo.component_id,
          component_name: component.name,
          code_preview: demoCode.substring(0, 200) + "...",
        },
      })
      .select("id")
      .single()

    if (codeError) {
      throw new Error(
        `Failed to store demo code embedding: ${codeError.message}`,
      )
    }

    return {
      success: true,
      data: {
        usage_description: demoDescription,
        metadata: {
          name: demo.name,
          demo_id: demoId,
          component_id: demo.component_id,
          component_name: component.name,
        },
      },
    }
  } catch (error) {
    console.error(`Error generating embeddings for demo ${demoId}:`, error)
    return {
      success: false,
      demo_id: demoId,
      error: error.message,
    }
  }
}

// Generate demo-specific search queries using Claude
async function generateDemoDescription(
  demoName: string,
  demoCode: string,
  componentName: string,
  componentCode: string,
): Promise<string> {
  // Create prompt for Claude
  const prompt = `${DEMO_PROMPT}

Demo Name: ${demoName}

Demo Code:
${trimCodeForPrompt(demoCode, 4000)}

Component Name: ${componentName}

Component Code:
${trimCodeForPrompt(componentCode, 4000)}`

  // Generate description using Claude
  try {
    const response = await anthropic.messages.create({
      model: claudeConfig.model,
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const demoDescription = response.content[0].text
    console.log(
      "Generated demo description:",
      demoDescription.substring(0, 200) + "...",
    )

    return demoDescription
  } catch (error) {
    console.error("Error generating demo description:", error)
    return `Error generating demo description: ${error.message}`
  }
}

// Main HTTP handler for the Edge Function
serve(async (req) => {
  try {
    // Enable CORS
    const headers = new Headers({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    })

    // Handle preflight request
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers })
    }

    // Parse request data
    const requestData = await req.json()

    // Process based on type
    let result

    if (requestData.type === "component") {
      // Process a single component
      result = await generateComponentEmbeddings(requestData.id)
    } else if (requestData.type === "component_capability") {
      // Process a single component using componentId
      result = await generateComponentEmbeddings(requestData.componentId)
    } else if (requestData.type === "demo") {
      // Process a single demo
      result = await generateDemoEmbedding(requestData.id)
    } else if (requestData.type === "process_demos_for_component") {
      // Process all demos for a component separately
      const componentId = requestData.componentId

      if (!componentId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "componentId is required for process_demos_for_component",
          }),
          {
            headers: { ...headers, "Content-Type": "application/json" },
            status: 400,
          },
        )
      }

      // Fetch demos for the component
      const { data: demos, error: demosError } = await supabase
        .from("demos")
        .select("id")
        .eq("component_id", componentId)

      if (demosError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to fetch demos: ${demosError.message}`,
          }),
          {
            headers: { ...headers, "Content-Type": "application/json" },
            status: 500,
          },
        )
      }

      // Return the demo IDs - the client will process them one by one
      result = {
        demos: demos || [],
        component_id: componentId,
      }
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Invalid type. Must be 'component', 'component_capability', 'demo', or 'process_demos_for_component'",
        }),
        {
          headers: { ...headers, "Content-Type": "application/json" },
          status: 400,
        },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        debug: requestData,
      }),
      {
        headers: { ...headers, "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error in generate-embeddings function:", error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      },
    )
  }
})
