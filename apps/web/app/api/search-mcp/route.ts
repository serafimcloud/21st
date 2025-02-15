import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { SearchResponse, SearchResponseMCP } from "@/types/global"
import { resolveRegistryDependencyTree } from "@/lib/queries.server"
import fetchFileTextContent from "@/lib/utils/fetchFileTextContent"

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
    // Check API key
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

    // Get search query and pagination params
    const body = await request.json()
    const { search, match_threshold = 0.33, limit = 5 } = body

    if (!search) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 },
      )
    }

    const { data: searchResults, error } = await supabase.functions.invoke(
      "ai-search-oai",
      {
        body: {
          search: search,
          match_threshold: match_threshold,
          limit: limit, // limit doesnt work within the function
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

    const searchResultsTruncated = searchResults.slice(0, limit)

    const { data: demos, error: demosError } = await supabase
      .from("demos")
      .select(
        `
        name,
        demo_code,
        component:components!component_id (
            name,
            code,
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
      // TS thinks that component could be an array, but it's not
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

      return {
        demoName: d.name,
        demoCode: demoCode ?? "",
        componentName: d.component!.name,
        componentCode: componentCode ?? "",
        registryDependencies: registryDependencies || undefined,
      }
    })

    const demosWithCodeAndRegistryDependencies = await Promise.all(promises)

    return NextResponse.json<SearchResponseMCP>({
      results: demosWithCodeAndRegistryDependencies,
    })
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
