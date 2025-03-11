"use client"

import React from "react"
import Image from "next/image"
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
              <Image
                src={collection.cover_url || "/placeholder.svg"}
                alt={collection.name}
                fill
                className="object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg"
                }}
                priority
              />
            </div>
          </div>
          <div className="absolute top-2 left-2 z-20 bg-background/90 backdrop-blur rounded-sm px-2 py-1 pointer-events-none flex items-center gap-1">
            <Layers size={16} className="text-foreground" />
            <span className="text-xs">{collection.components_count}</span>
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
              <p className="text-xs text-muted-foreground truncate">
                {collection.user_data?.display_name ||
                  collection.user_data?.name}
              </p>
            </div>
            {collection.description && (
              <div className="text-sm text-muted-foreground ml-3 truncate max-w-[120px]">
                {collection.description}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
