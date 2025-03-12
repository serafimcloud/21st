"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { CollectionWithUser } from "@/types/global"
import { CollectionCard } from "./collection-card"
import { TemplateCardSkeleton } from "@/components/ui/skeletons"

interface CollectionsListProps {
  collections: CollectionWithUser[]
}

function CollectionsList({ collections }: CollectionsListProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {collections.map((collection) => (
        <CollectionCard key={collection.id} collection={collection} />
      ))}
    </div>
  )
}

interface CollectionsContainerProps {
  tagSlug?: string
}

export function CollectionsContainer({ tagSlug }: CollectionsContainerProps) {
  const supabase = useClerkSupabaseClient()

  const { data: collections, isLoading } = useQuery({
    queryKey: ["collections", tagSlug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_collections_v1", {
        p_offset: 0,
        p_limit: 50,
        p_include_private: false,
      })

      if (error) throw error
      if (!data) return []

      return data.map((collection) => ({
        ...collection,
        user_data: collection.user_data || {
          id: "",
          name: "",
          display_name: "",
          image_url: "",
          display_image_url: "",
        },
      })) as CollectionWithUser[]
    },
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <TemplateCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return <CollectionsList collections={collections || []} />
}
