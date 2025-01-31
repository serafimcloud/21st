// apps/web/components/ui/sections-list.tsx
import React from "react"
import { cn } from "@/lib/utils"
import { SectionCard, SectionCardSkeleton } from "./section-card"
import { Section } from "@/types/global"

export function SectionsList({
  sections,
  isLoading,
  className,
  skeletonCount = 5,
}: {
  sections?: Section[] | null
  isLoading?: boolean
  className?: string
  skeletonCount?: number
}) {
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
        sections?.map((section) => (
          <SectionCard key={`${section.tag_id}`} section={section} />
        ))
      )}
    </div>
  )
}

export default SectionsList
