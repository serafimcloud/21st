import React from "react"
import { motion } from "motion/react"
import { Video } from "lucide-react"
import Image from "next/image"

import { TemplateWithUser } from "@/types/global"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatPrice } from "@/lib/utils"
import { TemplateVideoPreview } from "./template-video-preview"
import { useMediaQuery } from "@/hooks/use-media-query"

interface TemplateCardProps {
  template: TemplateWithUser
  onPreviewClick?: (template: TemplateWithUser) => void
}

export const TemplateCard = React.memo(function TemplateCard({
  template,
  onPreviewClick,
}: TemplateCardProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const handleClick = React.useCallback(() => {
    if (isDesktop) {
      onPreviewClick?.(template)
    } else {
      window.open(template.payment_url || "#", "_blank")
    }
  }, [template, onPreviewClick, isDesktop])

  return (
    <motion.div
      className="group relative p-[1px] cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative aspect-[16/10] mb-3 group">
        <div className="absolute inset-0">
          <div className="relative w-full h-full rounded-lg shadow-base overflow-hidden">
            <div className="absolute inset-0">
              <Image
                src={template.preview_url}
                alt={template.name}
                fill
                className="object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg"
                }}
                priority
              />
            </div>
            <div className="absolute inset-0 rounded-lg" />
            {template.video_url && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <TemplateVideoPreview template={template} />
              </div>
            )}
          </div>
        </div>
        {template.video_url && (
          <div
            className="absolute top-2 left-2 z-20 bg-background/90 backdrop-blur rounded-sm px-2 py-1 pointer-events-none"
            data-video-icon={`${template.id}`}
          >
            <Video size={16} className="text-foreground" />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3">
        <Avatar className="h-8 w-8 shadow-base">
          <AvatarImage
            src={
              template.user_data.display_image_url ||
              template.user_data.image_url ||
              "/placeholder.svg"
            }
            alt={
              template.user_data.display_name || template.user_data.name || ""
            }
          />
          <AvatarFallback>
            {(
              template.user_data.display_name?.[0] ||
              template.user_data.name?.[0] ||
              ""
            ).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center justify-between flex-grow min-w-0">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium truncate">{template.name}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {template.user_data.display_name || template.user_data.name}
            </p>
          </div>
          <div className="text-sm font-medium ml-3">
            {template.price > 0 ? formatPrice(template.price) : "Free"}
          </div>
        </div>
      </div>
    </motion.div>
  )
})
