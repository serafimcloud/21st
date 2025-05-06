import { OpenAI } from "openai"
import { NextResponse } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { defaultConfig, dependencyConfigs } = await request.json()

    console.log("🔄 [Tailwind Merge] Request received:", {
      defaultConfigLength: defaultConfig?.length,
      dependencyConfigsCount: dependencyConfigs?.length,
      dependencyConfigSizes: dependencyConfigs?.map((c: string) => c.length),
    })

    // Only proceed if we have custom configs to merge
    if (!dependencyConfigs?.length) {
      console.log(
        "⏩ [Tailwind Merge] No custom configs to merge, returning default",
      )
      return NextResponse.json({ tailwindConfig: defaultConfig })
    }

    const prompt = `You are a Tailwind CSS expert. Please merge the following Tailwind CSS configurations into a single optimized configuration.

Base Tailwind Config:
\`\`\`js
${defaultConfig}
\`\`\`

${dependencyConfigs
  .map(
    (config: string, index: number) => `
Dependency ${index + 1} Tailwind Config:
\`\`\`js
${config}
\`\`\`
`,
  )
  .join("\n")}

Please provide a merged Tailwind config that:
1. Combines all configurations efficiently
2. Resolves any conflicts by using the most specific/latest definitions
3. Maintains all necessary functionality
4. Eliminates duplicates
5. Preserves the structure of a valid Tailwind config
6. Includes ALL original configuration without truncation or simplification
7. Preserves all theme extensions, plugins, and customizations completely

Format the response as a JSON object with a 'tailwindConfig' key containing the complete merged configuration.`

    console.log("📤 [Tailwind Merge] Sending request to OpenAI:", {
      promptLength: prompt.length,
      configsToMerge: dependencyConfigs.length + 1, // +1 for default config
    })

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a Tailwind CSS expert who helps merge and optimize configurations. Always include all content completely without summarizing or truncating. Never omit any configuration properties.",
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

    // Handle both string and object formats for tailwindConfig
    let logInfo = {
      resultLength: result.tailwindConfig
        ? typeof result.tailwindConfig === "string"
          ? result.tailwindConfig.length
          : JSON.stringify(result.tailwindConfig).length
        : 0,
      hasConfig: !!result.tailwindConfig,
      firstFewLines: "",
    }

    // Add firstFewLines only if tailwindConfig is a string
    if (typeof result.tailwindConfig === "string") {
      logInfo.firstFewLines = result.tailwindConfig
        .split("\n")
        .slice(0, 3)
        .join("\n")
    } else if (result.tailwindConfig) {
      // For object format, convert to string representation for logging
      logInfo.firstFewLines =
        JSON.stringify(result.tailwindConfig).slice(0, 100) + "..."
    }

    console.log("📥 [Tailwind Merge] Received response from OpenAI:", logInfo)

    // Ensure tailwindConfig is always a string in the response
    if (result.tailwindConfig && typeof result.tailwindConfig !== "string") {
      result.tailwindConfig = JSON.stringify(result.tailwindConfig, null, 2)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ [Tailwind Merge] Error:", error)
    return NextResponse.json(
      { error: "Failed to merge Tailwind configurations" },
      { status: 500 },
    )
  }
}
