import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { SearchResponseMCP } from "@/types/global"
import { resolveRegistryDependencyTree } from "@/lib/queries.server"
import fetchFileTextContent from "@/lib/utils/fetchFileTextContent"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface SearchResult {
  id: number
  name: string
  component_data: {
    component_slug: string
  }
  user_id: string
  usage_data: {
    total_usages: number
  }
}

interface Demo {
  id: number
  name: string
  demo_code: string
  component_id: number
  component: {
    name: string
    code: string
    user_id: string
    direct_registry_dependencies: string[]
    demo_direct_registry_dependencies: string[]
  }
}

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
    if (keyError) {
      console.error("API key check error:", keyError)
      return NextResponse.json(
        { error: "Error validating API key" },
        { status: 401 },
      )
    }

    if (!keyCheck?.valid) {
      return NextResponse.json(
        { error: keyCheck?.error || "Invalid API key" },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { search, match_threshold = 0.33, limit = 5, userMessage = "" } = body

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

    console.log("Search embeddings response:", {
      searchResults,
      error,
    })

    if (error) {
      console.error("Search error:", error)
      return NextResponse.json(
        { error: "Error fetching search results" },
        { status: 500 },
      )
    }

    // Get demo results - now searchResults is an array directly
    const searchResultsTruncated = (searchResults as SearchResult[]).slice(
      0,
      limit,
    )
    console.log("Truncated search results:", searchResultsTruncated)

    // Get demo IDs directly from the results
    const demoIds = searchResultsTruncated.map((result) => result.id)
    console.log("Demo IDs:", demoIds)

    // Get component IDs from component_data
    const componentSlugs = searchResultsTruncated
      .map((result) => {
        const componentSlug = result.component_data?.component_slug
        return componentSlug ? `${result.user_id}/${componentSlug}` : null
      })
      .filter(Boolean)
    console.log("Component slugs:", componentSlugs)

    // Fetch demos with their components
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
      .in("id", demoIds)

    console.log("Demos query result:", {
      demos,
      demosError,
    })

    if (demosError) {
      console.error("Fetching demos error:", demosError)
      return NextResponse.json(
        { error: "Error fetching demos" },
        { status: 500 },
      )
    }

    // Process demos
    const demoPromises =
      demos?.map(async (demoRaw) => {
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
        const searchResult = searchResultsTruncated.find((r) => r.id === d.id)

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
      }) || []

    // Combine and sort results
    const allResults = await Promise.all(demoPromises)
    const sortedResults = allResults.sort((a, b) => {
      const similarityA = a.similarity || 0
      const similarityB = b.similarity || 0
      return similarityB - similarityA
    })

    const response = {
      results: sortedResults,
    }

    const responseObj = NextResponse.json<SearchResponseMCP>(response)

    // Get user data for analytics
    const { data: userData, error: userError } = await supabase
      .from("api_keys")
      .select("user_id")
      .eq("key", apiKey)
      .single()

    if (userError || !userData) {
      console.error("User ID fetch error:", userError)
    } else {
      const userId = userData.user_id

      // Get unique component IDs and author IDs from demos
      const componentIds = new Set(
        demos?.map((d) => d.component_id).filter(Boolean) || [],
      )

      const authorIds = new Set(
        demos
          ?.map((d) => {
            const component = Array.isArray(d.component)
              ? d.component[0]
              : d.component
            return component?.user_id
          })
          .filter(Boolean) || [],
      )

      if (componentIds.size > 0) {
        supabase
          .rpc("record_mcp_component_usage", {
            p_user_id: userId,
            p_api_key: apiKey,
            p_search_query: search,
            p_component_ids: Array.from(componentIds),
            p_author_ids: Array.from(authorIds),
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
