"use client"

import { useAtom } from "jotai"
import { ComponentsList } from "@/components/ui/items-list"
import { sortByAtom } from "@/components/features/main-page/main-page-header"
import { SortOption } from "@/types/global"
import { TagComponentsHeader } from "@/components/features/tag-page/tag-page-header"
import { useLayoutEffect } from "react"

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
    <div className="container mx-auto mt-20 px-4">
      <TagComponentsHeader tagName={tagName} currentSection={tagName} />
      <ComponentsList
        type="tag"
        tagSlug={tagSlug}
        sortBy={sortBy || initialSortBy}
      />
    </div>
  )
}
