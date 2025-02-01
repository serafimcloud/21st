// apps/web/components/features/section-card/section-card.tsx
"use client"

import { Video } from "lucide-react"
import Link from "next/link"
import { Section } from "@/types/global"
import SectionPreviewImage from "./section-preview-image"
import SectionVideoPreview from "./section-video-preview"

export function SectionCardSkeleton() {
  return (
    <div className="overflow-hidden animate-pulse">
      <div className="relative aspect-[4/3] mb-3">
        <div className="absolute inset-0 rounded-lg overflow-hidden bg-muted" />
      </div>
      <div className="h-4 bg-muted rounded w-3/4" />
    </div>
  )
}

export function SectionCard({
  section,
  isLoading,
}: {
  section?: Section
  isLoading?: boolean
}) {
  if (isLoading || !section) {
    return <SectionCardSkeleton />
  }

  const sectionUrl = `/s/${section.tag_slug}`

  return (
    <div className="overflow-hidden">
      <Link href={sectionUrl} className="block cursor-pointer">
        <div className="relative aspect-[4/3] mb-3 group">
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            <div className="relative w-full h-full">
              <div className="absolute inset-0" style={{ margin: "-1px" }}>
                <SectionPreviewImage
                  src={section.preview_url || "/placeholder.svg"}
                  alt={section.tag_name || ""}
                  fallbackSrc="/placeholder.svg"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-foreground/0 to-foreground/5" />
              {section.video_url && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <SectionVideoPreview videoUrl={section.video_url} />
                </div>
              )}
            </div>
          </div>
          {section.video_url && (
            <div className="absolute top-2 left-2 z-20 bg-background/90 backdrop-blur rounded-sm px-2 py-1 pointer-events-none">
              <Video size={16} className="text-foreground" />
            </div>
          )}
        </div>
        <h2 className="text-sm font-medium text-foreground">
          {section.tag_name}
        </h2>
      </Link>
    </div>
  )
}
