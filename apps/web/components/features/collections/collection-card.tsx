"use client"

import React from "react"
import { Layers } from "lucide-react"
import { toast } from "sonner"

import { CollectionWithUser } from "@/types/global"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface CollectionCardProps {
  collection: CollectionWithUser
  onPreviewClick?: (collection: CollectionWithUser) => void
}

export const CollectionCard = React.memo(function CollectionCard({
  collection,
  onPreviewClick,
}: CollectionCardProps) {
  const collectionUrl = `/c/${collection.slug}`

  const handleClick = (e: React.MouseEvent) => {
    if (onPreviewClick) {
      e.preventDefault()
      onPreviewClick(collection)
      return
    }

    if (e.metaKey || e.ctrlKey) {
      e.preventDefault()
      window.open(collectionUrl, "_blank")
      toast.success(`${collection.name} was opened in a new tab`)
    } else {
      window.location.href = collectionUrl
    }
  }

  return (
    <div className="p-[1px]">
      <div className="block cursor-pointer" onClick={handleClick}>
        <div className="relative aspect-[16/10] mb-3">
          <div className="absolute inset-0">
            <div className="relative w-full h-full rounded-lg shadow-base overflow-hidden">
              <img
                src={collection.cover_url || "/placeholder.svg"}
                alt={collection.name}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg"
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8 shadow-base">
            <AvatarImage
              src={
                collection.user_data?.display_image_url ||
                collection.user_data?.image_url ||
                "/placeholder.svg"
              }
              alt={
                collection.user_data?.display_name ||
                collection.user_data?.name ||
                ""
              }
            />
            <AvatarFallback>
              {(
                collection.user_data?.display_name?.[0] ||
                collection.user_data?.name?.[0] ||
                ""
              ).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center justify-between flex-grow min-w-0">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium truncate">
                {collection.name}
              </h3>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground ml-3">
              <Layers size={16} className="text-foreground" />
              <span>{collection.components_count}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
