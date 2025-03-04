import { useClerkSupabaseClient } from "@/lib/clerk"
import { useQuery, useMutation } from "@tanstack/react-query"

// Types for search results
export interface SearchResultsData {
  fullSolutions: DemoResult[]
  contextualComponents: ContextResult[]
  adaptableComponents: ComponentResult[]
}

export interface DemoResult {
  id: string
  demo_id: number
  demo_name: string
  demo_code: string
  component_id?: number
  component_name?: string
  similarity: number
  metadata: {
    description: string
    [key: string]: any
  }
}

export interface ContextResult {
  id: string
  component_id: number
  demo_id: number
  component_name: string
  demo_name: string
  context_description: string
  similarity: number
}

export interface ComponentResult {
  id: string
  component_id: number
  component_name: string
  component_description?: string
  enhanced_description?: string
  similarity: number
  metadata: {
    description: string
    [key: string]: any
  }
}

// Type for search parameters
export type SearchType = "combined" | "demo" | "context" | "component"

export interface SearchParams {
  query: string
  searchType?: SearchType
}

/**
 * Hook for searching components, demos, and contexts using embeddings
 */
export function useEmbeddingSearch(params?: SearchParams) {
  const supabase = useClerkSupabaseClient()

  return useQuery({
    queryKey: ["embedding-search", params?.query, params?.searchType],
    queryFn: async () => {
      if (!params?.query) {
        return null
      }

      const { data, error } = await supabase.functions.invoke(
        "search-embeddings",
        {
          body: {
            query: params.query,
            searchType: params.searchType || "combined",
          },
        },
      )

      if (error) {
        console.error("Error searching embeddings:", error)
        throw new Error(`Search failed: ${error.message}`)
      }

      return data.results as SearchResultsData
    },
    enabled: !!params?.query,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for generating embeddings for a component
 */
export function useGenerateComponentEmbeddings() {
  const supabase = useClerkSupabaseClient()

  return useMutation({
    mutationFn: async (componentId: number) => {
      const { data, error } = await supabase.functions.invoke(
        "generate-embeddings",
        {
          body: {
            type: "component_capability",
            componentId,
          },
        },
      )

      if (error) {
        throw new Error(
          `Failed to generate component embeddings: ${error.message}`,
        )
      }

      return data
    },
  })
}

/**
 * Hook for generating embeddings for a demo
 */
export function useGenerateDemoEmbeddings() {
  const supabase = useClerkSupabaseClient()

  return useMutation({
    mutationFn: async (demoId: number) => {
      const { data, error } = await supabase.functions.invoke(
        "generate-embeddings",
        {
          body: {
            type: "demo_usage",
            demoId,
          },
        },
      )

      if (error) {
        throw new Error(`Failed to generate demo embeddings: ${error.message}`)
      }

      return data
    },
  })
}

/**
 * Hook for generating usage context embeddings
 */
export function useGenerateContextEmbeddings() {
  const supabase = useClerkSupabaseClient()

  return useMutation({
    mutationFn: async ({
      componentId,
      demoId,
    }: {
      componentId: number
      demoId: number
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "generate-embeddings",
        {
          body: {
            type: "usage_context",
            componentId,
            demoId,
          },
        },
      )

      if (error) {
        throw new Error(
          `Failed to generate context embeddings: ${error.message}`,
        )
      }

      return data
    },
  })
}

/**
 * Utility function for server-side embedding search
 * Can be used in server components or API routes
 */
export async function searchEmbeddings(
  supabase: any,
  params: SearchParams,
): Promise<SearchResultsData | null> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "search-embeddings",
      {
        body: {
          query: params.query,
          searchType: params.searchType || "combined",
        },
      },
    )

    if (error) {
      console.error("Error searching embeddings:", error)
      throw new Error(`Search failed: ${error.message}`)
    }

    return data.results as SearchResultsData
  } catch (error) {
    console.error("Exception searching embeddings:", error)
    return null
  }
}
