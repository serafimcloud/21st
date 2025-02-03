"use client"

import React, { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { CategoryCard } from "./category-card"
import { CategoryCardSkeleton } from "@/components/ui/skeletons"
import { categories } from "@/lib/navigation"
import { useClerkSupabaseClient } from "@/lib/clerk"

interface CategoriesListProps {
  className?: string
  skeletonCount?: number
  filter?: string
}

export function CategoriesList({
  className,
  filter = "all",
  skeletonCount = 40,
}: CategoriesListProps) {
  const supabase = useClerkSupabaseClient()

  const allDemoIds = useMemo(() => {
    return categories
      .flatMap((category) => category.items.map((item) => item.demoId))
      .filter((id): id is number => id !== undefined)
  }, [])

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["categories-previews"],
    queryFn: async () => {
      const { data: categoryPreviews, error } = await supabase.rpc(
        "get_section_previews",
        {
          p_demo_ids: allDemoIds,
        },
      )

      if (error) throw error

      const categoriesWithPreviews = categories
        .flatMap((category) =>
          category.items.map((item) => {
            if (!item.demoId) return null
            const preview = categoryPreviews?.find(
              (s) => s.demo_id === item.demoId,
            )
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
              category_type:
                category.title === "UI Elements"
                  ? "ui-elements"
                  : "landing-pages",
              user_data: {},
              downloads_count: 0,
              view_count: 0,
            }
          }),
        )
        .filter((item): item is NonNullable<typeof item> => item !== null)

      return categoriesWithPreviews
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  const { uiCategories, landingCategories } = useMemo(() => {
    if (!categoriesData) return { uiCategories: [], landingCategories: [] }
    return {
      uiCategories: categoriesData.filter(
        (category) => category.category_type === "ui-elements",
      ),
      landingCategories: categoriesData.filter(
        (category) => category.category_type === "landing-pages",
      ),
    }
  }, [categoriesData])

  const categoriesToShow = useMemo(() => {
    switch (filter) {
      case "ui-elements":
        return uiCategories
      case "landing-pages":
        return landingCategories
      default:
        return categoriesData || []
    }
  }, [filter, uiCategories, landingCategories, categoriesData])

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 list-none pb-10",
        className,
      )}
    >
      {isLoading ? (
        <>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </>
      ) : (
        categoriesToShow.map((category) => (
          <CategoryCard key={`${category.tag_id}`} category={category} />
        ))
      )}
    </div>
  )
}

export default CategoriesList
