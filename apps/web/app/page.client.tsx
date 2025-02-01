"use client"

import React, { useEffect, useState } from "react"
import { useAtom } from "jotai"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { useSearchParams, useRouter } from "next/navigation"

import { DemoWithComponent, SortOption, SORT_OPTIONS } from "@/types/global"
import { Database } from "@/types/supabase"

import { useClerkSupabaseClient } from "@/lib/clerk"
import { sortByAtom } from "@/components/features/main-page/main-page-header"
import { Loader2 } from "lucide-react"
import ComponentsList from "@/components/ui/items-list"
import SectionsList from "@/components/features/sections/sections-list"
import { transformDemoResult } from "@/lib/utils/transformData"
import { sections } from "@/lib/navigation"
import { ComponentsHeader } from "@/components/features/main-page/main-page-header"

type SectionPreview = {
  demo_id: number
  preview_url: string
  video_url: string | null
}

type HomePageClientProps = {
  initialSections: SectionPreview[]
}

export function HomePageClient({ initialSections }: HomePageClientProps) {
  const supabase = useClerkSupabaseClient()
  const [sortBy, setSortBy] = useAtom(sortByAtom)
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"sections" | "components">(
    (searchParams.get("tab") as "sections" | "components") || "sections",
  )

  // Обновляем URL при изменении параметров
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", activeTab)
    if (activeTab === "components" && sortBy) {
      params.set("sort", sortBy)
    } else {
      params.delete("sort")
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }, [activeTab, sortBy, router, searchParams])

  // Инициализируем sortBy из URL при загрузке
  useEffect(() => {
    const sortFromUrl = searchParams.get("sort") as SortOption
    if (sortFromUrl && Object.keys(SORT_OPTIONS).includes(sortFromUrl)) {
      setSortBy(sortFromUrl)
    }
  }, [])

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
      queryKey: ["filtered-demos", sortBy],
      queryFn: async ({ pageParam = 0 }) => {
        console.log("Calling get_demos with params:", {
          p_quick_filter: "all",
          p_sort_by: sortBy,
          p_offset: Number(pageParam) * 24,
          p_limit: 24,
          p_tag_slug: undefined,
          p_include_private: false,
        })

        const { data: filteredData, error } = await supabase.rpc("get_demos", {
          p_quick_filter: "all",
          p_sort_by: sortBy,
          p_offset: Number(pageParam) * 24,
          p_limit: 24,
          p_tag_slug: undefined,
          p_include_private: false,
        } as Database["public"]["Functions"]["get_demos"]["Args"])

        console.log("get_demos response:", { filteredData, error })

        if (error) throw new Error(error.message)
        const transformedData = (filteredData || []).map(transformDemoResult)
        return {
          data: transformedData,
          total_count: (filteredData?.[0] as any)?.total_count ?? 0,
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
          filtersDisabled={false}
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
