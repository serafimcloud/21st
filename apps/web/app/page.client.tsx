"use client"

import React, { useEffect, useState } from "react"
import { useAtom } from "jotai"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"

import { DemoWithComponent } from "@/types/global"
import { Database } from "@/types/supabase"

import { useClerkSupabaseClient } from "@/lib/clerk"
import { searchQueryAtom } from "@/components/ui/header.client"
import {
  ComponentsHeader,
  sortByAtom,
} from "@/components/features/main-page/main-page-header"
import { Loader2 } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import ComponentsList from "@/components/ui/items-list"
import SectionsList from "@/components/features/sections/sections-list"
import { transformDemoResult } from "@/lib/utils/transformData"
import { sections } from "@/lib/navigation"

type SectionPreview = {
  demo_id: number
  preview_url: string
  video_url: string | null
}

type HomePageClientProps = {
  initialSections: SectionPreview[]
}

export function HomePageClient({ initialSections }: HomePageClientProps) {
  const [searchQuery] = useAtom(searchQueryAtom)
  const supabase = useClerkSupabaseClient()
  const [sortBy] = useAtom(sortByAtom)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<"sections" | "components">(
    "sections",
  )

  // Объединяем данные из навигации с превью
  const sectionsWithPreviews = sections
    .flatMap((section) =>
      section.items.map((item) => {
        if (!item.demoId) return null
        const preview = initialSections.find((s) => s.demo_id === item.demoId)
        if (!preview) return null

        return {
          tag_id: item.demoId,
          tag_name: item.title,
          tag_slug: item.href.replace("/s/", ""),
          component_id: item.demoId,
          component_name: item.title,
          component_slug: item.href.replace("/s/", ""),
          preview_url: preview.preview_url,
          video_url: preview.video_url || "",
          user_data: {},
          downloads_count: 0,
          view_count: 0,
        }
      }),
    )
    .filter((item): item is NonNullable<typeof item> => item !== null)

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
    useInfiniteQuery<{ data: DemoWithComponent[]; total_count: number }>({
      queryKey: ["filtered-demos", sortBy, debouncedSearchQuery],
      queryFn: async ({
        pageParam = 0,
      }): Promise<{ data: DemoWithComponent[]; total_count: number }> => {
        if (!sortBy) {
          return {
            data: [],
            total_count: 0,
          }
        }

        if (!debouncedSearchQuery) {
          const { data: filteredData, error } = await supabase.rpc(
            "get_demos",
            {
              p_quick_filter: "all",
              p_sort_by: sortBy,
              p_offset: Number(pageParam) * 24,
              p_limit: 24,
            } as Database["public"]["Functions"]["get_demos"]["Args"],
          )

          if (error) throw new Error(error.message)
          const transformedData = (filteredData || []).map(transformDemoResult)
          return {
            data: transformedData,
            total_count: (filteredData?.[0] as any)?.total_count ?? 0,
          }
        }

        const { data: searchResults, error } = await supabase.functions.invoke(
          "ai-search-oai",
          {
            body: {
              search: debouncedSearchQuery,
              match_threshold: 0.33,
            },
          },
        )

        if (error) throw new Error(error.message)
        const transformedSearchResults = (searchResults || []).map(
          transformDemoResult,
        )

        return {
          data: transformedSearchResults,
          total_count: transformedSearchResults.length,
        }
      },
      initialData: {
        pages: [{ data: [], total_count: 0 }],
        pageParams: [0],
      },
      enabled: activeTab === "components",
      staleTime: 0,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: false,
      initialPageParam: 0,
      refetchOnMount: true,
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

  const showSkeleton = isLoading || !data?.pages?.[0]?.data?.length
  const showSpinner = isFetching && !showSkeleton

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

  useEffect(() => {
    if (sortBy !== undefined) {
      queryClient.invalidateQueries({
        queryKey: ["filtered-demos", sortBy],
      })
    }
  }, [sortBy, queryClient])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto mt-20 px-4 max-w-[1200px]"
    >
      <div className="flex flex-col">
        <ComponentsHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          filtersDisabled={!!searchQuery}
        />
        {activeTab === "sections" ? (
          <SectionsList sections={sectionsWithPreviews} />
        ) : (
          <ComponentsList components={allDemos} isLoading={isLoading} />
        )}
        {showSpinner && (
          <div className="col-span-full flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-foreground/20" />
          </div>
        )}
      </div>
    </motion.div>
  )
}
