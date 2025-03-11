"use client"

import { useAtom } from "jotai"
import { ComponentsList } from "@/components/ui/items-list"
import { sortByAtom } from "@/components/features/main-page/main-page-header"
import { CollectionWithUser, SortOption } from "@/types/global"
import { useLayoutEffect } from "react"
import { motion } from "motion/react"
import { useQuery } from "@tanstack/react-query"
import { useClerkSupabaseClient } from "@/lib/clerk"

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
  collectionSlug,
  initialSortBy,
}: {
  collectionSlug: string
  initialSortBy: SortOption
}) {
  const [sortBy, setSortBy] = useAtom(sortByAtom)
  const supabase = useClerkSupabaseClient()

  const { data: collection, isLoading: isCollectionLoading } = useQuery({
    queryKey: ["collection", collectionSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select(
          `
          *,
          user_data:users(
            id,
            name,
            display_name,
            image_url,
            display_image_url
          ),
          components_count:components_to_collections(count)
        `,
        )
        .eq("slug", collectionSlug)
        .single()

      if (error) {
        console.error("Error fetching collection:", error)
        throw error
      }

      if (!data) {
        console.error("No collection data returned")
        return null
      }

      return {
        ...data,
        user_data: data.user_data || {
          id: "",
          name: "",
          display_name: "",
          image_url: "",
          display_image_url: "",
        },
        components_count: data.components_count?.[0]?.count || 0,
      } as CollectionWithUser
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })

  useLayoutEffect(() => {
    if (sortBy === undefined) setSortBy(initialSortBy)
  }, [sortBy, setSortBy, initialSortBy])

  if (isCollectionLoading || !collection) {
    console.log("[CollectionPage] Loading or no collection data:", {
      isCollectionLoading,
      collection,
    })
    return (
      <div className="container mx-auto my-20 px-[var(--container-x-padding)] max-w-[3680px] [--container-x-padding:20px] min-720:[--container-x-padding:24px] min-1280:[--container-x-padding:32px] min-1536:[--container-x-padding:80px]">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-muted rounded mb-2" />
          <div className="h-4 w-96 bg-muted rounded mb-4" />
          <div className="h-4 w-48 bg-muted rounded" />
        </div>
      </div>
    )
  }

  console.log("[CollectionPage] Rendering with data:", {
    collectionId: collection.id,
    sortBy,
    initialSortBy,
    collection,
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
