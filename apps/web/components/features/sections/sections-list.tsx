// apps/web/components/ui/sections-list.tsx
import React from "react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { SectionCard, SectionCardSkeleton } from "./section-card"
import { sections } from "@/lib/navigation"
import { useClerkSupabaseClient } from "@/lib/clerk"

export function SectionsList({
  className,
  skeletonCount = 40,
}: {
  className?: string
  skeletonCount?: number
}) {
  const supabase = useClerkSupabaseClient()

  // Собираем все ID демо из навигации
  const allDemoIds = sections
    .flatMap((section) => section.items.map((item) => item.demoId))
    .filter((id): id is number => id !== undefined)

  const { data: sectionsData, isLoading } = useQuery({
    queryKey: ["sections-previews"],
    queryFn: async () => {
      const { data: sectionPreviews, error } = await supabase.rpc(
        "get_section_previews",
        {
          p_demo_ids: allDemoIds,
        },
      )

      if (error) throw error

      // Объединяем данные из навигации с превью
      const sectionsWithPreviews = sections
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
