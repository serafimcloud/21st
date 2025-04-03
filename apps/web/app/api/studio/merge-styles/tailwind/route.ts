import { OpenAI } from "openai"
import { NextResponse } from "next/server"

const openai = new OpenAI()

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

Format the response as a JSON object with a 'tailwindConfig' key containing the merged configuration.`

    console.log("📤 [Tailwind Merge] Sending request to OpenAI:", {
      promptLength: prompt.length,
      configsToMerge: dependencyConfigs.length + 1, // +1 for default config
    })

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a Tailwind CSS expert who helps merge and optimize configurations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" },
    })

    if (!completion.choices[0]?.message.content) {
      throw new Error("No content in OpenAI response")
    }

    const result = JSON.parse(completion.choices[0].message.content)

    console.log("📥 [Tailwind Merge] Received response from OpenAI:", {
      resultLength: result.tailwindConfig?.length,
      hasConfig: !!result.tailwindConfig,
      firstFewLines: result.tailwindConfig?.split("\n").slice(0, 3).join("\n"),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ [Tailwind Merge] Error:", error)
    return NextResponse.json(
      { error: "Failed to merge Tailwind configurations" },
      { status: 500 },
    )
  }
}
