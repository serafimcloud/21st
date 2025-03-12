"use client"

import { useAtom } from "jotai"
import { ComponentsList } from "@/components/ui/items-list"
import { sortByAtom } from "@/components/features/main-page/main-page-header"
import { CollectionWithUser, SortOption } from "@/types/global"
import { useLayoutEffect } from "react"
import { CollectionHeader } from "@/components/features/collections/collection-header"

export function CollectionPageContent({
  initialSortBy,
  collection,
}: {
  initialSortBy: SortOption
  collection: CollectionWithUser
}) {
  const [sortBy, setSortBy] = useAtom(sortByAtom)

  useLayoutEffect(() => {
    if (sortBy === undefined) setSortBy(initialSortBy)
  }, [sortBy, setSortBy, initialSortBy])

  console.log("[CollectionPageContent] Collection data:", {
    id: collection.id,
    name: collection.name,
    sortBy: sortBy || initialSortBy,
  })

  return (
    <div className="container mx-auto my-20 px-[var(--container-x-padding)] max-w-[3680px] [--container-x-padding:20px] min-720:[--container-x-padding:24px] min-1280:[--container-x-padding:32px] min-1536:[--container-x-padding:80px]">
      <CollectionHeader collection={collection} />
      <ComponentsList
        key={`${collection.id}-${sortBy}`}
        type="collection"
        collectionId={collection.id}
        sortBy={sortBy || initialSortBy}
      />
    </div>
  )
}
