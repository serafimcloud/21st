"use client"

import { useAtom } from "jotai"
import { ComponentsList } from "@/components/ui/items-list"
import { sortByAtom } from "@/components/features/main-page/main-page-header"
import { SortOption } from "@/types/global"
import { TagComponentsHeader } from "@/components/features/tag-page/tag-page-header"
import { useLayoutEffect } from "react"
import { motion } from "motion/react"

export function TagPageContent({
  tagName,
  tagSlug,
  initialSortBy,
}: {
  tagName: string
  tagSlug: string
  initialSortBy: SortOption
}) {
  const [sortBy, setSortBy] = useAtom(sortByAtom)

  useLayoutEffect(() => {
    if (sortBy === undefined) setSortBy(initialSortBy)
  }, [])

  return (
    <div className="container mx-auto my-20 px-[var(--container-x-padding)] max-w-[3680px] [--container-x-padding:20px] min-720:[--container-x-padding:24px] min-1280:[--container-x-padding:32px] min-1536:[--container-x-padding:80px]">
      <div className="flex flex-col">
        <TagComponentsHeader tagName={tagName} currentSection={tagName} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
          }}
        >
          <ComponentsList
            type="tag"
            tagSlug={tagSlug}
            sortBy={sortBy || initialSortBy}
          />
        </motion.div>
      </div>
    </div>
  )
}
