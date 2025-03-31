import { NextRequest, NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { addNoCacheHeaders, withNoCache } from "../middleware"

interface ComponentGenerationRequest {
  prompt: string
  options?: {
    style?: string
    theme?: "light" | "dark"
    complexity?: "simple" | "medium" | "complex"
  }
}

async function generateComponent(request: NextRequest) {
  try {
    // Get prompt from request body
    const body: ComponentGenerationRequest = await request.json()
    const { prompt, options } = body

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Valid prompt is required" },
        { status: 400 },
      )
    }

    // Log the generation request
    console.log("API: Component generation request:", { prompt, options })

    // Simulate a delay for the component generation process (3-5 seconds)
    const generationTime = Math.floor(Math.random() * 2000) + 3000
    await new Promise((resolve) => setTimeout(resolve, generationTime))

    // Mock the component generation result
    // In a real implementation, this would call an AI service
    const generatedComponent = {
      id: `comp_${Date.now()}`,
      prompt,
      options,
      created_at: new Date().toISOString(),
      code: {
        jsx: generateMockJSX(prompt, options?.theme || "light"),
        css: generateMockCSS(options?.theme || "light"),
      },
      metadata: {
        generation_time_ms: generationTime,
        model: "mock-component-generator-v1",
      },
    }

    console.log("API: Component generation completed in", generationTime, "ms")

    // TODO: In production, you would store the generated component in Supabase
    /*
    const { data, error } = await supabaseWithAdminAccess
      .from("generated_components")
      .insert({
        prompt,
        options,
        code: generatedComponent.code,
        metadata: generatedComponent.metadata,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Failed to store generated component" },
        { status: 500 }
      )
    }
    */

    // Создаем ответ с заголовками для отключения кеширования
    const response = NextResponse.json(generatedComponent)
    return addNoCacheHeaders(response)
  } catch (error) {
    console.error("Error generating component:", error)
    return NextResponse.json(
      { error: "Failed to generate component" },
      { status: 500 },
    )
  }
}

// Helper functions to generate mock component code
function generateMockJSX(prompt: string, theme: string): string {
  const cleanPrompt = prompt.replace(/[^\w\s]/gi, "").substring(0, 30)

  return `import React from 'react';

export const ${capitalize(cleanPrompt.split(" ").join(""))}Component = () => {
  return (
    <div className="container ${theme === "dark" ? "theme-dark" : "theme-light"}">
      <h2 className="title">Generated from: "${prompt}"</h2>
      <p className="description">
        This is a mock component generated based on your prompt.
        In a real implementation, this would be AI-generated code.
      </p>
      <button className="cta-button">Click Me</button>
    </div>
  );
};`
}

function generateMockCSS(theme: string): string {
  const background = theme === "dark" ? "#1a1a1a" : "#ffffff"
  const textColor = theme === "dark" ? "#ffffff" : "#333333"
  const accentColor = theme === "dark" ? "#6d28d9" : "#4f46e5"

  return `.container {
  padding: 2rem;
  background-color: ${background};
  color: ${textColor};
  border-radius: 0.5rem;
  max-width: 800px;
  margin: 0 auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  font-weight: bold;
}

.description {
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.cta-button {
  background-color: ${accentColor};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.cta-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}`
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Экспортируем POST функцию с отключенным кешированием
export const POST = withNoCache(generateComponent)
