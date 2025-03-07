import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { getComponentInstallPrompt } from "@/lib/prompts"
import { PromptType } from "@/types/global"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function fetchCode(url: string) {
  if (!url) {
    console.error("Empty URL provided to fetchCode")
    throw new Error("Code URL is required")
  }
  const response = await fetch(url)
  if (!response.ok) {
    console.error(`Failed to fetch code from ${url}:`, response.statusText)
    throw new Error(`Failed to fetch code: ${response.statusText}`)
  }
  return response.text()
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key")
  const internalToken = request.headers.get("x-internal-token")
  const isInternalRequest = internalToken === process.env.INTERNAL_API_SECRET

  if (!isInternalRequest && !apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 401 })
  }

  if (!isInternalRequest && apiKey) {
    const { data: keyCheck, error: keyError } = await supabase.rpc(
      "check_api_key",
      { api_key: apiKey },
    )

    if (keyError || !keyCheck?.valid) {
      return NextResponse.json(
        { error: keyCheck?.error || "Invalid API key" },
        { status: 401 },
      )
    }
  }

  try {
    const body = await request.json()
    const { prompt_type, demo_id, rule_id, additional_context } = body

    console.log("Received request:", {
      prompt_type,
      demo_id,
      rule_id,
      additional_context,
    })

    if (!prompt_type || !demo_id) {
      return NextResponse.json(
        { error: "prompt_type and demo_id are required" },
        { status: 400 },
      )
    }

    console.log("Fetching demo data for:", demo_id)

    // Fetch component data from Supabase
    const { data: demo, error: demoError } = await supabase
      .from("demos")
      .select(
        `
        *,
        component:components(*)
      `,
      )
      .eq("id", demo_id)
      .single()

    if (demoError) {
      console.error("Demo fetch error:", demoError)
      return NextResponse.json(
        { error: "Error fetching demo data" },
        { status: 500 },
      )
    }

    if (!demo) {
      return NextResponse.json({ error: "Demo not found" }, { status: 404 })
    }

    if (!demo.component) {
      return NextResponse.json(
        { error: "Component data not found" },
        { status: 404 },
      )
    }

    console.log("Demo data:", {
      demo_code: demo.demo_code,
      component_code: demo.component.code,
      file_name: demo.component?.file_name,
      demo_file_name: demo.file_name,
    })

    if (!demo.demo_code || !demo.component.code) {
      return NextResponse.json(
        { error: "Demo or component code is missing" },
        { status: 400 },
      )
    }

    // Fetch actual code content
    const [componentCode, demoCode] = await Promise.all([
      fetchCode(demo.component.code),
      fetchCode(demo.demo_code),
    ])

    // If rule_id is provided, fetch the rule template
    let ruleData = null
    if (rule_id) {
      console.log("Fetching rule template for rule_id:", rule_id)
      const { data: rule, error: ruleError } = await supabase
        .from("prompt_rules")
        .select("tech_stack, theme, additional_context")
        .eq("id", rule_id)
        .single()

      if (ruleError) {
        console.error("Error fetching rule:", ruleError)
      }

      if (rule) {
        console.log("Found rule data:", JSON.stringify(rule, null, 2))
        ruleData = rule
      }
    }

    // Generate base prompt
    const promptParams = {
      promptType: prompt_type as PromptType,
      codeFileName: demo.component.file_name || "component.tsx",
      demoCodeFileName: demo.file_name || "demo.tsx",
      code: componentCode,
      demoCode: demoCode,
      npmDependencies: demo.component.npm_dependencies || {},
      registryDependencies: demo.component.registry_dependencies || {},
      npmDependenciesOfRegistryDependencies:
        demo.component.npm_dependencies_of_registry_dependencies || {},
      tailwindConfig: demo.component.tailwind_config,
      globalCss: demo.component.global_css,
      userAdditionalContext: additional_context,
      ...(ruleData && {
        promptRule: {
          id: rule_id,
          user_id: "",
          name: "",
          tech_stack: ruleData.tech_stack,
          theme: ruleData.theme,
          additional_context: ruleData.additional_context,
          created_at: "",
          updated_at: "",
        },
      }),
    }

    console.log(
      "Rule data being passed to promptRule:",
      ruleData
        ? JSON.stringify(
            {
              tech_stack: ruleData.tech_stack,
              theme: ruleData.theme,
              additional_context: ruleData.additional_context,
            },
            null,
            2,
          )
        : "No rule data",
    )

    console.log(
      "Generating prompt with params:",
      JSON.stringify(promptParams, null, 2),
    )
    let prompt = getComponentInstallPrompt(promptParams)
    console.log("Generated prompt content:", prompt.substring(0, 500) + "...")

    console.log("Base prompt generated")

    console.log(
      "Additional Context:",
      additional_context || "No additional context provided",
    )

    console.log("Final prompt structure:", {
      hasBasePrompt: !!prompt,
      hasRuleData: !!ruleData,
      hasAdditionalContext: !!additional_context,
    })

    return NextResponse.json({
      prompt,
      debug: {
        ruleApplied: !!ruleData,
        contextApplied: !!(additional_context || ruleData?.additional_context),
      },
    })
  } catch (error) {
    console.error("Full error details:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
