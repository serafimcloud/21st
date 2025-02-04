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
  component,
  isLoading,
}: {
  component?: DemoWithComponent | (Component & { user: User })
  isLoading?: boolean
}) {
  if (isLoading || !component) {
    return <ComponentCardSkeleton />
  }

  const userData = component.user
  const username = userData?.username || userData?.display_username
  const isDemo = "demo_slug" in component
  const componentSlug = isDemo
    ? component.component?.component_slug
    : component.component_slug

  if (!userData || !username || !componentSlug) {
    console.warn("Missing required data:", {
      userData,
      username,
      componentSlug,
      component,
    })
    return <ComponentCardSkeleton />
  }

  const isDemoWithComponent = isDemo && "component" in component

  const componentUrl = `/${username}/${componentSlug}/${isDemo ? component.demo_slug || "default" : "default"}`

  const videoUrl = isDemo ? component.video_url : null

  const likesCount = isDemo
    ? component.component?.likes_count || 0
    : component.likes_count || 0

  const viewCount = isDemo ? component.view_count || 0 : 0

  return (
    <div className="p-[1px]">
      <Link href={componentUrl} className="block cursor-pointer">
        <div className="relative aspect-[4/3] mb-3 group">
          <div className="absolute inset-0">
            <div className="relative w-full h-full rounded-lg shadow-base overflow-hidden">
              <div className="absolute inset-0">
                <ComponentPreviewImage
                  src={
                    isDemo
                      ? component.preview_url || "/placeholder.svg"
                      : component.preview_url || "/placeholder.svg"
                  }
                  alt={component.name || ""}
                  fallbackSrc="/placeholder.svg"
                  className="rounded-lg"
                />
              </div>
              <div className="absolute inset-0 rounded-lg" />
              {videoUrl && isDemoWithComponent && (
                <ComponentVideoPreview
                  component={component as DemoWithComponent}
                  demo={component as DemoWithComponent}
                />
              )}
            </div>
          </div>
          {videoUrl && (
            <div
              className="absolute top-2 left-2 z-20 bg-background/90 backdrop-blur rounded-sm px-2 py-1 pointer-events-none"
              data-video-icon={`${component.id}`}
            >
              <Video size={16} className="text-foreground" />
            </div>
          )}
        </div>
      </Link>
      <div className="flex space-x-3 items-center">
        <UserAvatar
          src={
            userData.display_image_url ||
            userData.image_url ||
            "/placeholder.svg"
          }
          alt={userData.display_name || userData.name || ""}
          size={32}
          user={userData}
          isClickable
        />
        <div className="flex items-center justify-between flex-grow min-w-0">
          <Link
            href={componentUrl}
            className="block cursor-pointer min-w-0 flex-1 mr-3"
          >
            <div className="flex flex-col min-w-0">
              <h2 className="text-sm font-medium text-foreground truncate">
                {isDemo ? component.component?.name : component.name}
              </h2>
              {component.name !== "Default" && (
                <p className="text-sm text-muted-foreground truncate">
                  {component.name}
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
