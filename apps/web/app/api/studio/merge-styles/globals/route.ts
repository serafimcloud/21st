import { OpenAI } from "openai"
import { NextResponse } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { defaultGlobalCss, dependencyGlobalCss } = await request.json()

    console.log("🔄 [Global CSS Merge] Request received:", {
      defaultCssLength: defaultGlobalCss?.length,
      dependencyCssCount: dependencyGlobalCss?.length,
      dependencyCssSizes: dependencyGlobalCss?.map((css: string) => css.length),
    })

    // Only proceed if we have custom styles to merge
    if (!dependencyGlobalCss?.length) {
      console.log(
        "⏩ [Global CSS Merge] No custom styles to merge, returning default",
      )
      return NextResponse.json({ globalCss: defaultGlobalCss })
    }

    const prompt = `You are a CSS expert. Please merge the following global CSS styles into a single optimized stylesheet.

Base Global CSS:
\`\`\`css
${defaultGlobalCss}
\`\`\`

${dependencyGlobalCss
  .map(
    (css: string, index: number) => `
Dependency ${index + 1} Global CSS:
\`\`\`css
${css}
\`\`\`
`,
  )
  .join("\n")}

Please provide a merged global.css that:
1. Combines all styles efficiently
2. Resolves any conflicts by using the most specific/latest definitions
3. Maintains all necessary functionality
4. Eliminates duplicates
5. Preserves cascade and specificity appropriately
6. Groups related styles together
7. Never shortens, simplifies, or omits any keyframe animations or complex selectors
8. Includes ALL original code without truncation or summarization
9. Preserves all vendor prefixes and browser-specific styles

Format the response as a JSON object with a 'globalCss' key containing the complete merged styles.`

    console.log("📤 [Global CSS Merge] Sending request to OpenAI:", {
      promptLength: prompt.length,
      stylesToMerge: dependencyGlobalCss.length + 1, // +1 for default styles
    })

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a CSS expert who helps merge and optimize stylesheets. Always include all content completely without summarizing or truncating. Preserve all keyframes, animations, and complex styles fully.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
    })

    if (!completion.choices[0]?.message.content) {
      throw new Error("No content in OpenAI response")
    }

    const result = JSON.parse(completion.choices[0].message.content)

    // Handle both string and object formats for globalCss
    let logInfo = {
      resultLength: result.globalCss
        ? typeof result.globalCss === "string"
          ? result.globalCss.length
          : JSON.stringify(result.globalCss).length
        : 0,
      hasCss: !!result.globalCss,
      firstFewLines: "",
    }

    // Add firstFewLines only if globalCss is a string
    if (typeof result.globalCss === "string") {
      logInfo.firstFewLines = result.globalCss
        .split("\n")
        .slice(0, 3)
        .join("\n")
    } else if (result.globalCss) {
      // For object format, convert to string representation for logging
      logInfo.firstFewLines =
        JSON.stringify(result.globalCss).slice(0, 100) + "..."
    }

    console.log("📥 [Global CSS Merge] Received response from OpenAI:", logInfo)

    // Ensure globalCss is always a string in the response
    if (result.globalCss && typeof result.globalCss !== "string") {
      result.globalCss = JSON.stringify(result.globalCss, null, 2)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ [Global CSS Merge] Error:", error)
    return NextResponse.json(
      { error: "Failed to merge global CSS" },
      { status: 500 },
    )
  }
}
