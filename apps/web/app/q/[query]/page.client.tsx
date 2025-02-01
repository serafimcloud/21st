"use client"

import React, { useEffect } from "react"
import { useAtom } from "jotai"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"

import { DemoWithComponent, SortOption, User, Component } from "@/types/global"

import { useClerkSupabaseClient } from "@/lib/clerk"
import { searchQueryAtom } from "@/components/ui/header.client"
import { sortByAtom } from "@/components/features/main-page/main-page-header"
import { Loader2 } from "lucide-react"
import ComponentsList from "@/components/ui/items-list"

type SearchPageClientProps = {
  initialQuery: string
  initialSortBy: SortOption
}

type SearchResult = {
  data: DemoWithComponent[]
  total_count: number
}

export function SearchPageClient({
  initialQuery,
  initialSortBy,
}: SearchPageClientProps) {
  const [, setSearchQuery] = useAtom(searchQueryAtom)
  const [sortBy, setSortBy] = useAtom(sortByAtom)
  const supabase = useClerkSupabaseClient()
  const queryClient = useQueryClient()

  useEffect(() => {
    setSearchQuery(initialQuery)
    setSortBy(initialSortBy)
  }, [initialQuery, initialSortBy, setSearchQuery, setSortBy])

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
    useInfiniteQuery<SearchResult>({
      queryKey: ["search-results", initialQuery, sortBy],
      queryFn: async ({ pageParam = 0 }) => {
        try {
          const { data: searchResults, error } =
            await supabase.functions.invoke("ai-search-oai", {
              body: {
                search: initialQuery,
                match_threshold: 0.33,
              },
            })

          if (error) throw new Error(error.message)
          if (!searchResults || !Array.isArray(searchResults)) {
            return { data: [], total_count: 0 }
          }

          const transformedResults = searchResults
            .map((result) => {
              const componentData = result.component_data as Component
              const userData = result.user_data as User

              if (!componentData || !userData) {
                return null
              }

              const componentWithUser = {
                ...componentData,
                user: userData,
              }

              const demoComponent: DemoWithComponent = {
                compiled_css: componentData.compiled_css,
                component_id: componentData.id,
                created_at: result.created_at || null,
                demo_code: componentData.demo_code || "",
                demo_dependencies: componentData.dependencies,
                demo_direct_registry_dependencies: {},
                demo_slug: result.demo_slug || "default",
                id: result.id,
                name: result.name || "Default",
                preview_url: result.preview_url,
                user: userData,
                user_id: userData.id,
                video_url: result.video_url,
                view_count: result.view_count || 0,
                component: componentWithUser,
                tags: [],
                embedding: null,
                embedding_oai: null,
                fts: null,
                pro_preview_image_url: null,
                updated_at: result.updated_at || null,
              }

              return demoComponent
            })
            .filter((item): item is DemoWithComponent => item !== null)

          return {
            data: transformedResults,
            total_count: transformedResults.length,
          }
        } catch (err) {
          return { data: [], total_count: 0 }
        }
      },
      initialData: {
        pages: [{ data: [], total_count: 0 }],
        pageParams: [0],
      },
      staleTime: 0,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: false,
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        if (!lastPage?.data || lastPage.data.length === 0) return undefined
        const loadedCount = allPages.reduce(
          (sum, page) => sum + page.data.length,
          0,
        )
        return loadedCount < lastPage.total_count ? allPages.length : undefined
      },
    })

  const allDemos = data?.pages?.flatMap((d) => d.data) ?? []
  const showSkeleton = isFetching && !isLoading

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 1000 &&
        !isLoading &&
        hasNextPage
      ) {
        fetchNextPage()
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isLoading, hasNextPage, fetchNextPage])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto mt-20 px-4 max-w-[1200px]"
    >
      <div className="flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">
            Search results for "{initialQuery}"
          </h1>
          <p className="text-muted-foreground">
            {showSkeleton
              ? "Searching..."
              : `Found ${data?.pages[0]?.total_count ?? 0} components`}
          </p>
        </div>
        <ComponentsList components={allDemos} isLoading={showSkeleton} />
      </div>
    </motion.div>
  )
}
