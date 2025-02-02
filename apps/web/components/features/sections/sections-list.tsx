// apps/web/components/ui/sections-list.tsx
"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { SectionCard } from "./section-card"
import { SectionCardSkeleton } from "@/components/ui/skeletons"
import { sections } from "@/lib/navigation"
import { useClerkSupabaseClient } from "@/lib/clerk"

interface SectionsListProps {
  className?: string
  skeletonCount?: number
  filter?: string
}

export function SectionsList({
  className,
  filter = "all",
  skeletonCount = 40,
}: SectionsListProps) {
  const supabase = useClerkSupabaseClient()

  // Фильтруем секции по типу
  const filteredSections = sections.filter((section) => {
    if (filter === "all") return true
    if (filter === "ui") return section.title === "UI elements"
    if (filter === "landing") return section.title === "Landing Pages"
    return false
  })

  // Собираем все ID демо из отфильтрованных секций
  const allDemoIds = filteredSections
    .flatMap((section) => section.items.map((item) => item.demoId))
    .filter((id): id is number => id !== undefined)

  const { data: sectionsData, isLoading } = useQuery({
    queryKey: ["sections-previews", filter],
    queryFn: async () => {
      const { data: sectionPreviews, error } = await supabase.rpc(
        "get_section_previews",
        {
          p_demo_ids: allDemoIds,
        },
      )

      if (error) throw error

      // Объединяем данные из навигации с превью только для отфильтрованных секций
      const sectionsWithPreviews = filteredSections
        .flatMap((section) =>
          section.items.map((item) => {
            if (!item.demoId) return null
            const preview = sectionPreviews?.find(
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
              user_data: {},
              downloads_count: 0,
              view_count: 0,
            }
          }),
        )
        .filter((item): item is NonNullable<typeof item> => item !== null)

      return sectionsWithPreviews
    },
  })

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
            <SectionCardSkeleton key={i} />
          ))}
        </>
      ) : (
        sectionsData?.map((section) => (
          <SectionCard key={`${section.tag_id}`} section={section} />
        ))
      )}
    </div>
  )
}

export default SectionsList
