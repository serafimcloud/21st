"use client"

import React, { useEffect } from "react"
import { useAtom } from "jotai"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"

import { DemoWithComponent, SortOption } from "@/types/global"

import { useClerkSupabaseClient } from "@/lib/clerk"
import { searchQueryAtom } from "@/components/ui/header.client"
import {
  sortByAtom,
} from "@/components/features/main-page/main-page-header"
import { Loader2 } from "lucide-react"
import ComponentsList from "@/components/ui/items-list"

type SearchPageClientProps = {
  initialQuery: string
  initialSortBy: SortOption
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
    useInfiniteQuery<{ data: DemoWithComponent[]; total_count: number }>({
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

              const transformed = {
                id: result.id,
                name: result.name || "Default",
                demo_slug: result.demo_slug || "default",
                preview_url: result.preview_url,
                video_url: result.video_url,
                view_count: result.view_count || 0,
                user: userData,
                component: {
                  id: componentData.id,
                  name: componentData.name,
                  description: componentData.description,
                  component_slug: componentData.component_slug,
                  preview_url: componentData.preview_url,
                  video_url: componentData.video_url,
                  code: componentData.code,
                  demo_code: componentData.demo_code,
                  dependencies: componentData.dependencies,
                  tailwind_config_extension:
                    componentData.tailwind_config_extension,
                  compiled_css: componentData.compiled_css,
                  likes_count: componentData.likes_count || 0,
                  user: userData,
                },
                tags: [],
                created_at: result.created_at,
                updated_at: result.updated_at,
              } as unknown as DemoWithComponent

              return transformed
            })
            .filter(Boolean)

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

  const allDemos = data?.pages?.flatMap((d) => d.data)
  const showSpinner = isFetching && !isLoading

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
            Found {data?.pages[0]?.total_count || 0} components
          </p>
        </div>
        <ComponentsList components={allDemos} isLoading={isLoading} />
        {showSpinner && (
          <div className="col-span-full flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-foreground/20" />
          </div>
        )}
      </div>
    </motion.div>
  )
}
