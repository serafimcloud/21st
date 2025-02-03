"use client"

import { memo } from "react"
import { Video } from "lucide-react"
import Link from "next/link"
import { Category } from "@/types/global"
import CategoryPreviewImage from "./category-preview-image"
import CategoryVideoPreview from "./category-video-preview"

interface CategoryCardProps {
  category: Category
}

export const CategoryCard = memo(function CategoryCard({
  category,
}: CategoryCardProps) {
  const categoryUrl = `/s/${category.tag_slug}`

  return (
    <div className="p-[1px]">
      <Link href={categoryUrl} className="block cursor-pointer">
        <div className="relative aspect-[4/3] mb-3 group">
          <div className="absolute inset-0">
            <div className="relative w-full h-full rounded-lg shadow-base overflow-hidden">
              <CategoryPreviewImage
                src={category.preview_url || "/placeholder.svg"}
                alt={category.tag_name || ""}
                fallbackSrc="/placeholder.svg"
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 rounded-lg" />
              {category.video_url && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <CategoryVideoPreview videoUrl={category.video_url} />
                </div>
              )}
            </div>
          </div>
          {category.video_url && (
            <div className="absolute top-2 left-2 z-20 bg-background/90 backdrop-blur rounded-sm px-2 py-1 pointer-events-none">
              <Video size={16} className="text-foreground" />
            </div>
          )}
        </div>
        <h2 className="text-sm font-medium text-foreground">
          {category.tag_name}
        </h2>
      </Link>
    </div>
  )
})
