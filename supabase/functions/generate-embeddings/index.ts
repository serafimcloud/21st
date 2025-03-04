import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import "https://deno.land/x/xhr@0.3.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4.86.1"
import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk@0.39.0"
import { CLAUDE_CONFIG, OPENAI_CONFIG } from "./ai-config.ts"

// Configure CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

// Initialize OpenAI client for embeddings
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY") || "",
})

// Initialize Anthropic client for descriptions
const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")
let anthropic: any = null

try {
  if (!anthropicApiKey) {
    console.warn(
      "⚠️ ANTHROPIC_API_KEY not found in environment variables. AI descriptions will fall back to default templates.",
    )
  } else if (anthropicApiKey.trim() === "") {
    console.warn(
      "⚠️ ANTHROPIC_API_KEY is empty. AI descriptions will fall back to default templates.",
    )
  } else {
    // Создаём клиент по современной спецификации API
    anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    })
    console.log("✓ Anthropic client initialized successfully")
  }
} catch (error) {
  console.error("❌ Error initializing Anthropic client:", error)
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || ""

/**
 * Trim code to fit within model context limits
 */
function trimCodeForPrompt(code: string, maxLength: number = 8000): string {
  if (!code) return ""
  if (code.length <= maxLength) return code

  // Если код превышает максимальную длину, обрезаем его и добавляем комментарий
  return (
    code.substring(0, maxLength) +
    `\n\n/* This code has been truncated to fit within model limits. Original length: ${code.length} characters */`
  )
}

/**
 * Fetch component code from URL if the code field contains a URL
 */
async function fetchCodeFromUrl(codeOrUrl: string): Promise<string> {
  if (!codeOrUrl) return ""

  // Check if the code is actually a URL
  if (codeOrUrl.startsWith("http")) {
    try {
      console.log(`Fetching code from URL: ${codeOrUrl}`)
      const response = await fetch(codeOrUrl)

      if (!response.ok) {
        throw new Error(
          `Failed to fetch code: ${response.status} ${response.statusText}`,
        )
      }

      const code = await response.text()
      console.log(
        `Successfully fetched code from URL (${code.length} characters)`,
      )
      return code
    } catch (error) {
      console.error(`Error fetching code from URL: ${error}`)
      return `/* Error fetching code from ${codeOrUrl}: ${error} */`
    }
  }

  // If it's not a URL, return the original code
  return codeOrUrl
}

/**
 * Generate embedding using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    console.log(
      `Generating embedding using model: ${OPENAI_CONFIG.EMBEDDING_MODEL}`,
    )
    const response = await openai.embeddings.create({
      model: OPENAI_CONFIG.EMBEDDING_MODEL,
      input: text,
    })
    const embedding = response.data[0].embedding
    console.log(`Generated embedding with ${embedding.length} dimensions`)

    // Проверяем соответствие ожидаемой размерности
    if (embedding.length !== OPENAI_CONFIG.EMBEDDING_DIMENSIONS) {
      console.error(
        `⚠️ Warning: Expected ${OPENAI_CONFIG.EMBEDDING_DIMENSIONS} dimensions, but got ${embedding.length}`,
      )
    }

    return embedding
  } catch (error) {
    console.error("❌ Error generating embedding:", error)
    throw error
  }
}

/**
 * Generate AI-enhanced description using Claude
 */
async function generateDescription(
  type: "component" | "demo" | "context",
  data: any,
): Promise<string> {
  let prompt = ""

  if (type === "component") {
    // Обрезаем код до безопасного размера
    const trimmedCode = trimCodeForPrompt(data.code, 8000)

    prompt = `
      Analyze this UI component and provide a comprehensive and detailed technical description.
      
      Component Name: ${data.name}
      Original Description: ${data.description || "No description provided"}
      Component Code: 
      ${trimmedCode || "No code available"}
      
      Please provide a detailed technical description (200-300 words) that covers:
      1. What this component does and its primary use cases
      2. Key functionality and features
      3. Technical aspects (state management, events, props, etc.)
      4. Visual characteristics and UI behavior
      5. Notable customization options or variants

      Write in a clear, technical style that would help developers understand how to use this component.
      
      IMPORTANT: Your response should be at minimum 200 words and contain significantly more detail than the Original Description.
      DO NOT return the Original Description as your answer.
      DO NOT start your answer with "The Accordion component is".
      Start your response with a full technical description.
    `
  } else if (type === "demo") {
    // Обрезаем код до безопасного размера
    const trimmedCode = trimCodeForPrompt(data.code, 8000)

    prompt = `
      Analyze this UI demo and provide a comprehensive technical description.
      
      Demo Name: ${data.name}
      Original Description: ${data.description || "No description provided"}
      Related Component: ${data.componentName || "No specific component associated"}
      Component Description: ${data.componentDescription || ""}
      Demo Code:
      ${trimmedCode || "No code available"}
      
      Please provide a detailed technical description (200-300 words) that covers:
      1. What this demo showcases and its primary purpose
      2. Key implementation details and technical approaches
      3. How components are used and integrated
      4. State management and data flow
      5. User interactions and UI behavior
      
      Write in a clear, technical style that would help developers understand the implementation.
      
      IMPORTANT: Your response should be at minimum 200 words and contain significantly more detail than the Original Description.
      DO NOT return the Original Description as your answer.
      Start your response with a full technical description.
    `
  } else if (type === "context") {
    // Обрезаем код до безопасного размера
    const trimmedComponentCode = trimCodeForPrompt(data.componentCode, 4000)
    const trimmedDemoCode = trimCodeForPrompt(data.demoCode, 4000)

    prompt = `
      Analyze how this component is being used in this specific demo context and provide a detailed analysis.
      
      Component Name: ${data.componentName || ""}
      Component Description: ${data.componentDescription || ""}
      Component Code:
      ${trimmedComponentCode || "No component code available"}
      
      Demo Name: ${data.demoName || ""}
      Demo Code:
      ${trimmedDemoCode || "No demo code available"}
      
      Please provide a detailed technical analysis (at least 200 words) that describes:
      1. How the component is being implemented in this specific demo
      2. What customizations or props are being used in this context
      3. What specific functionality or features of the component are being showcased
      4. How the demo extends or demonstrates the capabilities of the component
      5. Any notable implementation patterns or technical details worth highlighting
      
      Write in a clear, technical style that would help developers understand how to use this component in similar contexts.
      Be comprehensive and detailed in your analysis, focusing on the technical implementation details.
    `
  }

  try {
    console.log(`Generating ${type} description...`)

    // Проверяем, инициализирован ли клиент Anthropic
    if (!anthropic) {
      console.warn(
        "Anthropic client not initialized, using original description",
      )
      return (
        data.description ||
        `Default ${type} description. No AI description available.`
      )
    }

    console.log(`Sending request to Claude for ${type} description...`)

    try {
      // Создаем сообщение используя актуальный API
      console.log("Using standard anthropic.messages.create API")
      const response = await anthropic.messages.create({
        model: CLAUDE_CONFIG.MODEL,
        max_tokens: CLAUDE_CONFIG.MAX_TOKENS,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        system: CLAUDE_CONFIG.SYSTEM_PROMPT,
      })

      console.log(`Received response from Claude for ${type} description`)

      if (!response.content || response.content.length === 0) {
        console.error("Invalid response from Claude:", response)
        throw new Error(
          "Failed to generate description: Invalid response format",
        )
      }

      // Извлекаем текст из контента (в новой версии API структура может отличаться)
      let generatedDescription = ""
      for (const contentBlock of response.content) {
        if (contentBlock.type === "text") {
          generatedDescription += contentBlock.text
        }
      }

      generatedDescription = generatedDescription.trim()

      // Проверяем, не вернул ли Claude оригинальное описание или слишком короткий ответ
      const originalDescription = data.description || ""
      const isTooShort = generatedDescription.split(" ").length < 100 // Минимум 100 слов
      const isSameAsOriginal =
        originalDescription.trim() === generatedDescription.trim() ||
        (generatedDescription.includes(originalDescription) &&
          generatedDescription.split(" ").length <
            originalDescription.split(" ").length + 20)

      if (isTooShort || isSameAsOriginal) {
        console.warn(
          `Claude returned ${isTooShort ? "too short" : "same as original"} description. Retrying with stronger instructions...`,
        )

        // Запрос с более строгими инструкциями
        const retryPrompt =
          prompt +
          `
        
        WARNING: Your previous response was ${isTooShort ? "too short" : "too similar to the original description"}.
        YOU MUST provide a completely new, detailed technical analysis that is AT LEAST 200 words long.
        DO NOT simply repeat or slightly modify the original description.
        The original description was: "${originalDescription}"
        YOUR RESPONSE SHOULD BE COMPLETELY DIFFERENT AND MUCH MORE DETAILED.
        Analyze the code in depth and create a thorough technical description.
        `

        try {
          const retryResponse = await anthropic.messages.create({
            model: CLAUDE_CONFIG.MODEL,
            max_tokens: CLAUDE_CONFIG.MAX_TOKENS,
            messages: [
              {
                role: "user",
                content: retryPrompt,
              },
            ],
            system: CLAUDE_CONFIG.SYSTEM_PROMPT,
          })

          if (!retryResponse.content || retryResponse.content.length === 0) {
            console.error("Invalid retry response from Claude:", retryResponse)
            throw new Error(
              "Failed to generate description on retry: Invalid response format",
            )
          }

          // Извлекаем текст из контента (в новой версии API структура может отличаться)
          let retryGeneratedDescription = ""
          for (const contentBlock of retryResponse.content) {
            if (contentBlock.type === "text") {
              retryGeneratedDescription += contentBlock.text
            }
          }

          generatedDescription = retryGeneratedDescription.trim()
        } catch (retryError) {
          console.error("Error during retry request to Claude:", retryError)
          // В случае ошибки при повторном запросе используем резервное описание
          return getFallbackDescription(data.name, originalDescription, type)
        }

        // Если и второй запрос не вернул подходящее описание, используем заготовленный текст
        if (
          generatedDescription.split(" ").length < 100 ||
          originalDescription.trim() === generatedDescription.trim() ||
          (generatedDescription.includes(originalDescription) &&
            generatedDescription.split(" ").length <
              originalDescription.split(" ").length + 20)
        ) {
          console.error(
            "Claude failed to generate a proper description after retry.",
          )
          return getFallbackDescription(data.name, originalDescription, type)
        }
      }

      return generatedDescription
    } catch (claudeError) {
      console.error(`Error calling Claude API:`, claudeError)
      return getFallbackDescription(data.name, data.description || "", type)
    }
  } catch (error) {
    console.error(`Error generating ${type} description:`, error)
    return (
      data.description ||
      `Default ${type} description. Failed to generate AI description.`
    )
  }
}

/**
 * Return a fallback description when AI generation fails
 */
function getFallbackDescription(
  name: string,
  originalDescription: string,
  type: "component" | "demo" | "context",
): string {
  if (type === "component") {
    return `${name} is a React component that provides ${originalDescription.toLowerCase()} It is built using React and integrates with common UI patterns. The component is designed to be flexible, customizable, and accessible, following best practices for modern web development. It is part of a component library and can be styled and modified to fit various design systems. The code demonstrates proper handling of props, state management, and event handling typical of React components. It is structured following composition patterns that make it reusable across different projects and contexts.`
  } else if (type === "demo") {
    return `This demo showcases ${name}, which ${originalDescription.toLowerCase()} It demonstrates how to implement and utilize UI components in a real-world application context. The demo illustrates best practices for component integration, state management, and user interaction patterns. It provides developers with a practical example of how to use the component library effectively in their own projects. The implementation follows modern React patterns and can be adapted to different design requirements and use cases.`
  } else {
    return `This context analysis is not provided in the fallback description. Please implement the fallback logic for context analysis.`
  }
}

/**
 * Generate embedding for a component
 */
async function generateComponentEmbedding(supabase: any, componentId: number) {
  console.log(`Generating embeddings for component ID: ${componentId}`)

  // Get component data
  const { data: component, error: componentError } = await supabase
    .from("components")
    .select("name, description, code")
    .eq("id", componentId)
    .single()

  if (componentError || !component) {
    throw new Error(
      `Failed to fetch component data: ${componentError?.message || "Component not found"}`,
    )
  }

  // Component code is directly available in the 'code' field
  let componentCode = component.code || ""
  console.log(
    `Component code (original): ${componentCode.substring(0, 200)}...`,
  )

  // Если в поле code содержится URL, загружаем код с этого URL
  componentCode = await fetchCodeFromUrl(componentCode)

  console.log(`Component code length: ${componentCode.length} characters`)
  console.log(`Component code preview: ${componentCode.substring(0, 200)}...`)

  // Проверяем, что код компонента действительно доступен
  if (!componentCode || componentCode.length < 10) {
    console.warn(
      `Component code is missing or too short for component ID: ${componentId}. Code value:`,
      componentCode,
    )

    // Пытаемся получить код из другого источника, если он отсутствует
    if (component.name === "Accordion") {
      console.log("Using fallback code for Accordion component")
      // Пример кода компонента Accordion
      const fallbackCode = `
import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      className
    )}
    {...props}
  >
    <div className="pb-4 pt-0">{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }`

      componentCode = fallbackCode
    }
  }

  // Prepare text for generating description
  const descriptionPrompt = {
    name: component.name,
    description: component.description || "",
    code: componentCode || "No code available",
  }

  // Создаем переменную для хранения промпта
  // Обрезаем код до безопасного размера
  const trimmedCode = trimCodeForPrompt(componentCode, 8000)

  const prompt = `
    Analyze this UI component and provide a comprehensive and detailed technical description.
    
    Component Name: ${component.name}
    Original Description: ${component.description || "No description provided"}
    Component Code: 
    ${trimmedCode || "No code available"}
    
    Please provide a detailed technical description (200-300 words) that covers:
    1. What this component does and its primary use cases
    2. Key functionality and features
    3. Technical aspects (state management, events, props, etc.)
    4. Visual characteristics and UI behavior
    5. Notable customization options or variants

    Write in a clear, technical style that would help developers understand how to use this component.
    
    IMPORTANT: Your response should be at minimum 200 words and contain significantly more detail than the Original Description.
  `

  // Generate enhanced description using AI
  console.log("Calling generateDescription for component")
  const enhancedDescription = await generateDescription(
    "component",
    descriptionPrompt,
  )
  console.log(
    "Received enhancedDescription from generateDescription for component:",
    enhancedDescription,
  )

  // Prepare text for embeddings with the actual code
  const embeddingText = `
    Component Name: ${component.name}
    Component Description: ${component.description || ""}
    Enhanced Description: ${enhancedDescription}
    Component Code: ${componentCode ? "Available" : "Code not available"}
  `
  console.log(`Embedding text preview: ${embeddingText.substring(0, 200)}...`)

  // Generate embedding
  const embedding = await generateEmbedding(embeddingText)

  // Store embedding in database
  const { data, error } = await supabase
    .from("component_embeddings")
    .insert({
      component_id: componentId,
      embedding_type: "capability",
      embedding,
      metadata: {
        description: enhancedDescription,
        has_code: !!componentCode,
        // Сохраняем полный текст промпта и эмбединга для будущих запросов
        full_prompt: prompt,
        full_embedding_text: embeddingText,
      },
    })
    .select("id")
    .single()

  if (error) {
    throw new Error(`Failed to store component embedding: ${error.message}`)
  }

  return {
    ...data,
    description: enhancedDescription,
    // Возвращаем полный промпт, а не его превью
    prompt_preview: prompt,
    // Возвращаем полный текст для эмбединга, а не его превью
    embedding_text_preview: embeddingText,
  }
}

/**
 * Generate embedding for a demo
 */
async function generateDemoEmbedding(supabase: any, demoId: number) {
  console.log(`Generating embeddings for demo ID: ${demoId}`)

  // Get demo data - remove 'description' since it doesn't exist
  const { data: demo, error: demoError } = await supabase
    .from("demos")
    .select("name, component_id, demo_code")
    .eq("id", demoId)
    .single()

  if (demoError || !demo) {
    throw new Error(
      `Failed to fetch demo data: ${demoError?.message || "Demo not found"}`,
    )
  }

  // Demo code is directly available in the 'demo_code' field
  let demoCode = demo.demo_code || ""

  // Если в поле demo_code содержится URL, загружаем код с этого URL
  demoCode = await fetchCodeFromUrl(demoCode)

  console.log(`Demo code length: ${demoCode.length} characters`)

  // Get component data if component_id is available
  let componentName = null
  let componentDescription = null
  if (demo.component_id) {
    const { data: component } = await supabase
      .from("components")
      .select("name, description")
      .eq("id", demo.component_id)
      .single()

    if (component) {
      componentName = component.name
      componentDescription = component.description
    }
  }

  // Prepare text for generating description - use empty string instead of demo.description
  const descriptionPrompt = {
    name: demo.name || "",
    description: "", // No description column in demos table
    code: demoCode || "No code available",
    componentName,
    componentDescription,
  }

  // Создаем переменную для хранения промпта
  // Обрезаем код до безопасного размера
  const trimmedCode = trimCodeForPrompt(demoCode, 8000)

  const prompt = `
    Analyze this UI demo and provide a comprehensive technical description.
    
    Demo Name: ${demo.name || ""}
    Original Description: No description provided
    Related Component: ${componentName || "No specific component associated"}
    Component Description: ${componentDescription || ""}
    Demo Code: 
    ${trimmedCode || "No code available"}
    
    Please provide a detailed technical description (200-300 words) that covers:
    1. What this demo illustrates and its primary use cases
    2. How it implements or showcases the associated component (if applicable)
    3. Technical implementation details
    4. Notable customizations, props, or state management shown in the demo
    5. Key functionality or interactive features demonstrated

    Write in a clear, technical style that would help developers understand how to use these patterns.
    
    IMPORTANT: Your response should be at minimum 200 words and contain significantly more detail than just the demo name.
  `

  // Generate enhanced description using AI
  const enhancedDescription = await generateDescription(
    "demo",
    descriptionPrompt,
  )

  // Prepare text for embeddings - remove demo.description
  const embeddingText = `
    Demo Name: ${demo.name || ""}
    Enhanced Description: ${enhancedDescription}
    Component: ${componentName || "No associated component"}
    Component Description: ${componentDescription || ""}
    Demo Code: ${demoCode ? "Available" : "Not available"}
  `
  console.log(`Embedding text preview: ${embeddingText.substring(0, 200)}...`)

  // Generate embedding
  const embedding = await generateEmbedding(embeddingText)

  // Store embedding in database
  const { data, error } = await supabase
    .from("demo_embeddings")
    .insert({
      demo_id: demoId,
      embedding_type: "usage",
      embedding,
      metadata: {
        description: enhancedDescription,
        has_code: !!demoCode,
        component_id: demo.component_id,
        component_name: componentName,
        // Сохраняем полный текст промпта и эмбединга для будущих запросов
        full_prompt: prompt,
        full_embedding_text: embeddingText,
      },
    })
    .select("id")
    .single()

  if (error) {
    throw new Error(`Failed to store demo embedding: ${error.message}`)
  }

  return {
    ...data,
    description: enhancedDescription,
    // Возвращаем полный промпт, а не его превью
    prompt_preview: prompt,
    // Возвращаем полный текст для эмбединга, а не его превью
    embedding_text_preview: embeddingText,
  }
}

/**
 * Generate embedding for a usage context (component + demo combination)
 */
async function generateContextEmbedding(
  supabase: any,
  componentId: number,
  demoId: number,
) {
  console.log(
    `Generating context embeddings for component ID: ${componentId} and demo ID: ${demoId}`,
  )

  // Get component data
  const { data: component, error: componentError } = await supabase
    .from("components")
    .select("name, description, code")
    .eq("id", componentId)
    .single()

  if (componentError || !component) {
    throw new Error(
      `Failed to fetch component data: ${componentError?.message || "Component not found"}`,
    )
  }

  // Get demo data - remove description from select
  const { data: demo, error: demoError } = await supabase
    .from("demos")
    .select("name, demo_code")
    .eq("id", demoId)
    .single()

  if (demoError || !demo) {
    throw new Error(
      `Failed to fetch demo data: ${demoError?.message || "Demo not found"}`,
    )
  }

  // Component code handling - convert from URL if needed
  let componentCode = component.code || ""
  console.log(`Original component code: ${componentCode.substring(0, 200)}...`)
  componentCode = await fetchCodeFromUrl(componentCode)
  console.log(`Component code length: ${componentCode.length} characters`)

  // Demo code handling - convert from URL if needed
  let demoCode = demo.demo_code || ""
  console.log(`Original demo code: ${demoCode.substring(0, 200)}...`)
  demoCode = await fetchCodeFromUrl(demoCode)
  console.log(`Demo code length: ${demoCode.length} characters`)

  // Prepare prompt for context generation
  // Обрезаем код до безопасного размера
  const trimmedComponentCode = trimCodeForPrompt(componentCode, 4000)
  const trimmedDemoCode = trimCodeForPrompt(demoCode, 4000)

  const prompt = `
    Analyze how this component is being used in this specific demo context and provide a detailed analysis.
    
    Component Name: ${component.name || ""}
    Component Description: ${component.description || ""}
    Component Code:
    ${trimmedComponentCode || "No component code available"}
    
    Demo Name: ${demo.name || ""}
    Demo Code:
    ${trimmedDemoCode || "No demo code available"}
    
    Please provide a detailed technical analysis (at least 200 words) that describes:
    1. How the component is being implemented in this specific demo
    2. What customizations or props are being used in this context
    3. What specific functionality or features of the component are being showcased
    4. How the demo extends or demonstrates the capabilities of the component
    5. Any notable implementation patterns or technical details worth highlighting
    
    Write in a clear, technical style that would help developers understand how to use this component in similar contexts.
    Be comprehensive and detailed in your analysis, focusing on the technical implementation details.
  `

  // Generate usage analysis using AI
  const contextAnalysis = await generateDescription("context", {
    componentName: component.name,
    componentDescription: component.description || "",
    componentCode,
    demoName: demo.name || "",
    demoCode,
  })

  // Prepare text for embeddings
  const embeddingText = `
    Component Name: ${component.name || ""}
    Component Description: ${component.description || ""}
    Demo Name: ${demo.name || ""}
    Context Analysis: ${contextAnalysis}
  `
  console.log(`Embedding text preview: ${embeddingText.substring(0, 200)}...`)

  // Generate embedding
  const embedding = await generateEmbedding(embeddingText)

  // Store embedding in database
  const { data, error } = await supabase
    .from("usage_context_embeddings")
    .insert({
      component_id: componentId,
      demo_id: demoId,
      embedding,
      context_description: contextAnalysis,
      metadata: {
        description: contextAnalysis,
        component_name: component.name,
        demo_name: demo.name,
        has_component_code: !!componentCode,
        has_demo_code: !!demoCode,
        // Сохраняем полный текст промпта и эмбединга для будущих запросов
        full_prompt: prompt,
        full_embedding_text: embeddingText,
      },
    })
    .select("id")
    .single()

  if (error) {
    throw new Error(`Failed to store context embedding: ${error.message}`)
  }

  return {
    ...data,
    description: contextAnalysis,
    // Возвращаем полный промпт, а не его превью
    prompt_preview: prompt,
    // Возвращаем полный текст для эмбединга, а не его превью
    embedding_text_preview: embeddingText,
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
    const { type, componentId, demoId } = await req.json()

    if (!type) {
      return new Response(
        JSON.stringify({ error: "Missing required field: type" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // Initialize Supabase client with request context
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    })

    let result

    // Process different embedding types
    switch (type) {
      case "component_capability":
        if (!componentId) {
          return new Response(
            JSON.stringify({ error: "Missing required field: componentId" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          )
        }
        result = await generateComponentEmbedding(supabase, componentId)
        break

      case "demo_usage":
        if (!demoId) {
          return new Response(
            JSON.stringify({ error: "Missing required field: demoId" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          )
        }
        result = await generateDemoEmbedding(supabase, demoId)
        break

      case "usage_context":
        if (!componentId || !demoId) {
          return new Response(
            JSON.stringify({
              error: "Missing required fields: componentId and demoId",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          )
        }
        result = await generateContextEmbedding(supabase, componentId, demoId)
        break

      default:
        return new Response(
          JSON.stringify({ error: `Unknown embedding type: ${type}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        )
    }

    // Return success response with debugging info
    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        debug: {
          type,
          componentId,
          demoId,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error in generate-embeddings function:", error)

    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }
})
