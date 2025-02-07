/* eslint-disable @next/next/no-img-element */
"use client"

import React from "react"
import Link from "next/link"
import { Video, Eye, Heart } from "lucide-react"

import { DemoWithComponent, Component, User } from "@/types/global"
import ComponentPreviewImage from "./card-image"
import { ComponentVideoPreview } from "./card-video"
import { UserAvatar } from "../../ui/user-avatar"
import { ComponentCardSkeleton } from "../../ui/skeletons"

export function ComponentCard({
  demo,
  isLoading,
}: {
  demo?: DemoWithComponent | (Component & { user: User })
  isLoading?: boolean
}) {
  if (isLoading || !demo) {
    return <ComponentCardSkeleton />
  }

  const userData = "component" in demo ? demo.component?.user : demo.user
  const username = userData?.username || userData?.display_username
  const isDemo = "demo_slug" in demo
  const componentSlug = isDemo
    ? demo.component?.component_slug
    : demo.component_slug

  if (!userData || !username || !componentSlug) {
    console.warn("Missing required data:", {
      userData,
      username,
      componentSlug,
      demo,
    })
    return <ComponentCardSkeleton />
  }

  const isDemoWithComponent = isDemo && "component" in demo

  const componentUrl = `/${username}/${componentSlug}/${isDemo ? demo.demo_slug || "default" : "default"}`

  const videoUrl = isDemo ? demo.video_url : null

  const likesCount = isDemo
    ? demo.component?.likes_count || 0
    : demo.likes_count || 0

  const viewCount = isDemo ? demo.view_count || 0 : 0

  const previewUrl = demo.preview_url || "/placeholder.svg"

  const componentName = isDemo ? demo.component?.name || "" : demo.name || ""

  return (
    <div className="p-[1px]">
      <Link href={componentUrl} className="block cursor-pointer">
        <div className="relative aspect-[4/3] mb-3 group">
          <div className="absolute inset-0">
            <div className="relative w-full h-full rounded-lg shadow-base overflow-hidden">
              <div className="absolute inset-0">
                <ComponentPreviewImage
                  src={previewUrl}
                  alt={componentName}
                  fallbackSrc="/placeholder.svg"
                  className="rounded-lg"
                />
              </div>
              <div className="absolute inset-0 rounded-lg" />
              {videoUrl && isDemoWithComponent && (
                <ComponentVideoPreview
                  component={demo as DemoWithComponent}
                  demo={demo as DemoWithComponent}
                />
              )}
            </div>
          </div>
          {videoUrl && (
            <div
              className="absolute top-2 left-2 z-20 bg-background/90 backdrop-blur rounded-sm px-2 py-1 pointer-events-none"
              data-video-icon={`${demo.id}`}
            >
              <Video size={16} className="text-foreground" />
            </div>
          )}
        </div>
      </Link>
      <div className="flex space-x-3 items-center">
        <UserAvatar
          src={
            demo.user.display_image_url ||
            demo.user.image_url ||
            "/placeholder.svg"
          }
          alt={demo.user.display_name || demo.user.name || ""}
          size={32}
          user={demo.user}
          isClickable
        />
        <div className="flex items-center justify-between flex-grow min-w-0">
          <Link
            href={componentUrl}
            className="block cursor-pointer min-w-0 flex-1 mr-3"
          >
            <div className="flex flex-col min-w-0">
              <h2 className="text-sm font-medium text-foreground truncate">
                {isDemo ? demo.component?.name : demo.name}
              </h2>
              {demo.name !== "Default" && (
                <p className="text-sm text-muted-foreground truncate">
                  {demo.name}
                </p>
              )}
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {viewCount > 0 && (
              <div className="flex items-center text-xs text-muted-foreground whitespace-nowrap shrink-0 gap-1">
                <Eye size={14} />
                <span>{viewCount}</span>
              </div>
            )}
            {likesCount > 0 && (
              <div className="flex items-center text-xs text-muted-foreground whitespace-nowrap shrink-0 gap-1">
                <Heart size={14} className="text-muted-foreground" />
                <span>{likesCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
