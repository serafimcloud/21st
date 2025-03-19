import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { SearchResponseMCP } from "@/types/global"
import { resolveRegistryDependencyTree } from "@/lib/queries.server"
import fetchFileTextContent from "@/lib/utils/fetchFileTextContent"
import { supabaseWithAdminAccess } from "@/lib/supabase"

interface SearchResult {
  id: number
  usage_data?: {
    total_usages: number
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key")

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 401 })
  }

  try {
    const { data: keyCheck, error: keyError } = await supabase.rpc(
      "check_api_key",
      { api_key: apiKey },
    )
    if (keyError || !keyCheck?.valid) {
      // Check API key in api_keys table
      const { data: apiKeyData, error: apiKeyError } =
        await supabaseWithAdminAccess
          .from("api_keys")
          .select("*")
          .eq("key", apiKey)
          .eq("is_active", true)
          .single()

      // If key is not found or inactive
      if (apiKeyError || !apiKeyData) {
        return NextResponse.json(
          { success: false, error: "Invalid or inactive API key" },
          { status: 401 },
        )
      }
    }

    const body = await request.json()
    const {
      search,
      match_threshold = 0.33,
      limit = 3,
      userMessage = "",
      skipUsageRecording = false,
    } = body

    if (!search) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 },
      )
    }

    const { data: searchResults, error } = await supabase.functions.invoke(
      "search-embeddings",
      {
        body: {
          search,
          match_threshold,
          userMessage,
        },
      },
    )

    if (error) {
      console.error("Search error:", error)
      return NextResponse.json(
        { error: "Error fetching search results" },
        { status: 500 },
      )
    }

    const searchResultsTruncated = searchResults.slice(
      0,
      limit,
    ) as SearchResult[]

    const { data: demos, error: demosError } = await supabase
      .from("demos")
      .select(
        `
        id,
        name,
        demo_code,
        component_id,
        component:components!component_id (
            name,
            code,
            user_id,
            direct_registry_dependencies,
            demo_direct_registry_dependencies
        )
      `,
      )
      .in(
        "id",
        searchResultsTruncated.map((result: any) => result.id),
      )

    if (demosError) {
      console.error("Fetching demos error:", demosError)
      return NextResponse.json(
        { error: "Error fetching demos" },
        { status: 500 },
      )
    }

    const promises = demos?.map(async (demoRaw) => {
      const component = Array.isArray(demoRaw.component)
        ? demoRaw.component[0]
        : demoRaw.component
      const d = { ...demoRaw, component }

      const { data: demoCode } = await fetchFileTextContent(d.demo_code)
      const { data: componentCode } = await fetchFileTextContent(
        d.component!.code as string,
      )

      const { data: registryDependencies } =
        await resolveRegistryDependencyTree({
          supabase,
          sourceDependencySlugs: [
            ...d.component!.direct_registry_dependencies,
            ...d.component!.demo_direct_registry_dependencies,
          ],
          withDemoDependencies: false,
        })

      // Find original search result to get similarity
      const searchResult = searchResultsTruncated.find(
        (r: SearchResult) => r.id === d.id,
      )

      return {
        demoName: d.name,
        demoCode: demoCode ?? "",
        componentName: d.component!.name,
        componentCode: componentCode ?? "",
        registryDependencies: registryDependencies || undefined,
        similarity: searchResult?.usage_data?.total_usages
          ? searchResult.usage_data.total_usages / 1000
          : undefined, // Normalize usage as similarity
      }
    })

    const demosWithCodeAndRegistryDependencies = await Promise.all(promises)
    const sortedResults = demosWithCodeAndRegistryDependencies.sort((a, b) => {
      const similarityA = a.similarity || 0
      const similarityB = b.similarity || 0
      return similarityB - similarityA
    })

    const { data: userData, error: userError } = await supabase
      .from("api_keys")
      .select("user_id")
      .eq("key", apiKey)
      .single()

    const response = {
      results: sortedResults,
    }

    const responseObj = NextResponse.json<SearchResponseMCP>(response)

    if (!skipUsageRecording) {
      if (userError || !userData) {
        console.error("User ID fetch error:", userError)
      } else {
        const userId = userData.user_id

        const componentIds =
          demos
            ?.map((demoRaw) => {
              return demoRaw.component_id
            })
            .filter(Boolean) || []

        const authorIds =
          demos
            ?.map((demoRaw) => {
              const component = Array.isArray(demoRaw.component)
                ? demoRaw.component[0]
                : demoRaw.component
              return component?.user_id
            })
            .filter(Boolean) || []

        if (componentIds.length > 0) {
          supabase
            .rpc("record_mcp_component_usage", {
              p_user_id: userId,
              p_api_key: apiKey,
              p_search_query: search,
              p_component_ids: componentIds,
              p_author_ids: authorIds,
            })
            .then(({ data, error }) => {
              if (error) {
                console.error("Error recording component usage:", error)
              } else {
                console.log("Component usage recorded successfully:", data)
                if (data && typeof data === "object") {
                  console.log("Generation cost details:", {
                    subscription_plan: data.subscription_plan,
                    generation_cost: data.generation_cost,
                    ai_cost_share: data.ai_cost_share,
                    platform_share: data.platform_share,
                    total_author_share: data.total_author_share,
                  })
                }
              }
            })
            .then(undefined, (err: Error) => {
              console.error("Exception recording component usage:", err)
            })
        }
      }
    }

    return responseObj
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
