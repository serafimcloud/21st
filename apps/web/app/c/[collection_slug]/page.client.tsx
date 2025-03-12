"use client"

import { useAtom } from "jotai"
import { ComponentsList } from "@/components/ui/items-list"
import { sortByAtom } from "@/components/features/main-page/main-page-header"
import { CollectionWithUser, SortOption } from "@/types/global"
import { useLayoutEffect } from "react"
import { motion } from "motion/react"

interface CollectionHeaderProps {
  collection: CollectionWithUser
}

function CollectionHeader({ collection }: CollectionHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2">{collection.name}</h1>
      {collection.description && (
        <p className="text-muted-foreground">{collection.description}</p>
      )}
      <div className="flex items-center gap-2 mt-4">
        <span className="text-sm text-muted-foreground">Created by</span>
        <span className="text-sm font-medium">
          {collection.user_data?.display_name ||
            collection.user_data?.name ||
            "Unknown"}
        </span>
      </div>
    </div>
  )
}

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
