"use client"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { promptOptions } from "@/lib/prompts"
import { PromptType } from "@/types/global"
import { Bookmark, Eye, Video } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AMPLITUDE_EVENTS, trackEvent } from "@/lib/amplitude"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { bookmarkDemo } from "@/lib/queries"
import { cn, shouldHideLeaderboardRankings } from "@/lib/utils"
import { Component, DemoWithComponent, User } from "@/types/global"
import { useUser } from "@clerk/nextjs"
import NumberFlow from "@number-flow/react"
import { motion } from "motion/react"
import router from "next/router"
import { UpvoteIcon } from "../../icons/upvote-icon"
import { ComponentCardSkeleton } from "../../ui/skeletons"
import { UserAvatar } from "../../ui/user-avatar"
import ComponentPreviewImage from "./card-image"
import { ComponentVideoPreview } from "./card-video"

// Extended type to include leaderboard fields
type LeaderboardDemoWithComponent = DemoWithComponent & {
  global_rank?: number
  votes_count?: number
  has_voted?: boolean
}

export function ComponentCard({
  demo,
  isLoading,
  hideUser,
  onClick,
  onCtrlClick,
  hideVotes,
  isLeaderboard,
  onVote,
}: {
  demo?: DemoWithComponent | (Component & { user: User })
  isLoading?: boolean
  hideUser?: boolean
  onClick?: () => void
  onCtrlClick?: (url: string) => void
  hideVotes?: boolean
  isLeaderboard?: boolean
  onVote?: (demoId: number) => Promise<void>
}) {
  if (isLoading || !demo) {
    return <ComponentCardSkeleton />
  }

  const { user } = useUser()
  const supabase = useClerkSupabaseClient()
  const userData = "component" in demo ? demo.component?.user : demo.user
  const username = userData?.username || userData?.display_username
  const isDemo = "demo_slug" in demo
  const componentSlug = isDemo
    ? demo.component?.component_slug
    : demo.component_slug
  const isTouch = window.matchMedia("(pointer: coarse)").matches

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

  // Check if it's a leaderboard component
  const isLeaderboardComponent = isDemo && "global_rank" in demo

  const componentUrl = `/${username}/${componentSlug}/${isDemo ? demo.demo_slug || "default" : "default"}`

  const videoUrl = isDemo ? demo.video_url : null

  const bookmarksCount = isDemo ? demo.bookmarks_count || 0 : 0

  const viewCount = isDemo ? demo.view_count || 0 : 0

  // Safely access votes_count if it exists
  const votesCount =
    isDemo && "votes_count" in demo
      ? (demo as LeaderboardDemoWithComponent).votes_count || 0
      : 0

  // Check if the user has voted for this item (only for leaderboard items)
  const hasVoted =
    isDemo && "has_voted" in demo
      ? (demo as LeaderboardDemoWithComponent).has_voted
      : false

  const formatNumber = (num: number) => {
    if (num === undefined || num === null || isNaN(num)) {
      return "0"
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  const previewUrl = demo.preview_url || "/placeholder.svg"

  const componentName = isDemo ? demo.component?.name || "" : demo.name || ""

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + componentUrl)
    toast.success("Link copied to clipboard")
  }

  const handleCopyPrompt = async (promptType: PromptType) => {
    try {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt_type: promptType,
          demo_id: demo.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate prompt")
      }

      const { prompt } = await response.json()
      navigator.clipboard.writeText(prompt)
      toast.success("Prompt copied to clipboard")
    } catch (error) {
      toast.error("Error generating prompt")
    }
  }

  const handleBookmark = async () => {
    if (!user) {
      toast(
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Authentication required</p>
            <p className="text-sm text-muted-foreground">
              Please sign in to bookmark components
            </p>
          </div>
          <Link href="https://accounts.21st.dev/sign-in">
            <Button size="sm" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>,
        {
          duration: 5000,
        },
      )
      return
    }

    try {
      const demoId = isDemo ? demo.id : null

      if (!demoId) {
        throw new Error("Cannot bookmark: missing demo ID")
      }

      await bookmarkDemo(supabase, user.id, demoId)

      toast.success(
        <div className="flex items-center gap-2">
          <Bookmark size={16} className="shrink-0" fill="currentColor" />
          <span>Component bookmarked!</span>
        </div>,
      )

      trackEvent(AMPLITUDE_EVENTS.LIKE_COMPONENT, {
        componentId: isDemo && demo.component_id ? demo.component_id : demo.id,
        demoId: demoId,
        userId: user.id,
        source: "context_menu",
      })
    } catch (error) {
      console.error("Error bookmarking component:", error)
      toast.error("Failed to bookmark component")
    }
  }

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast(
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Authentication required</p>
            <p className="text-sm text-muted-foreground">
              Please sign in to vote
            </p>
          </div>
          <Link href="https://accounts.21st.dev/sign-in">
            <Button size="sm" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>,
        {
          duration: 5000,
        },
      )
      return
    }

    if (onVote && demo.id) {
      try {
        await onVote(demo.id)
      } catch (error) {
        console.error("Error voting:", error)
        toast.error("Failed to update vote")
      }
    }
  }

  // Hide rankings on weekdays
  const hideRankings = shouldHideLeaderboardRankings()

  return (
    <ContextMenu>
      <ContextMenuTrigger
        className="block p-[1px] select-none"
        disabled={isTouch}
      >
        <div
          className="block select-none"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey) {
              e.preventDefault()
              if (onCtrlClick) {
                onCtrlClick(componentUrl)
              } else {
                window.open(componentUrl, "_blank")
                toast.success(`${componentName} was opened in a new tab`)
              }
            } else if (onClick) {
              e.preventDefault()
              onClick()
            } else {
              router.push(componentUrl)
            }
          }}
        >
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
            <div className="absolute top-2 left-2 z-20 flex gap-2">
              {videoUrl && (
                <div
                  className="bg-background/90 backdrop-blur rounded-sm px-2 py-1 pointer-events-none"
                  data-video-icon={`${demo.id}`}
                >
                  <Video size={16} className="text-foreground" />
                </div>
              )}
            </div>
            {/* Vote button for leaderboard items - Always show when isLeaderboard, but hide count when hideRankings */}
            {isLeaderboard && onVote && (
              <div
                className="absolute top-2 right-2 z-30"
                onClick={(e) => e.stopPropagation()}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div onClick={handleVote}>
                        <motion.div
                          layout="size"
                          layoutId={`vote-button-${demo.id}`}
                          initial={false}
                          transition={{
                            duration: 0.3,
                            ease: "easeInOut",
                            layout: {
                              type: "spring",
                              stiffness: 300,
                              damping: 30,
                            },
                          }}
                          className={cn(
                            "h-8 shadow-sm border-[0.5px] flex items-center",
                            !votesCount || hideVotes
                              ? "rounded-full w-8 justify-center px-0"
                              : "rounded-full px-3 gap-1.5",
                            hasVoted
                              ? "bg-background/90 text-primary hover:bg-background/95"
                              : "bg-background/90 text-foreground/70 hover:bg-background/95 hover:text-foreground",
                          )}
                        >
                          {/* Icon wrapper with proper vertical alignment */}
                          <div className="flex items-center justify-center flex-shrink-0">
                            <UpvoteIcon isVoted={hasVoted} size={14} />
                          </div>

                          {votesCount > 0 && !hideVotes && (
                            <motion.div
                              initial={{ width: 0, opacity: 0 }}
                              animate={{ width: "auto", opacity: 1 }}
                              exit={{ width: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden flex-shrink-0 flex items-center"
                            >
                              <span className="text-xs font-medium whitespace-nowrap leading-none">
                                <NumberFlow
                                  value={Number(formatNumber(votesCount))}
                                  transformTiming={{
                                    duration: 550,
                                    easing: "ease-in-out",
                                  }}
                                  opacityTiming={{
                                    duration: 350,
                                    easing: "ease-out",
                                  }}
                                  trend={0}
                                />
                              </span>
                            </motion.div>
                          )}
                        </motion.div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {hasVoted ? "Remove vote" : "Vote for this component"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
            {/* Add Top of Week badge for top 3 leaderboard components */}
            {isLeaderboardComponent &&
              typeof demo.global_rank === "number" &&
              demo.global_rank <= 3 && (
                <div className="absolute top-2 right-2 z-20">
                  {/* Only show on weekends (Saturday and Sunday) */}
                  {!shouldHideLeaderboardRankings() && (
                    <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-md">
                      <span className="text-xs font-medium">
                        #{demo.global_rank} of Week
                      </span>
                    </div>
                  )}
                </div>
              )}
          </div>
          <div className="flex space-x-3 items-center">
            {!hideUser && (
              <div onClick={(e) => e.stopPropagation()}>
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
              </div>
            )}
            <div className="flex items-center justify-between flex-grow min-w-0">
              <div className="block min-w-0 flex-1 mr-3">
                <div className="flex flex-col min-w-0">
                  <h2 className="text-sm font-medium text-foreground truncate">
                    {isDemo ? demo.component?.name : demo.name}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {viewCount > 0 && (
                  <div className="flex items-center text-xs text-muted-foreground whitespace-nowrap shrink-0 gap-1">
                    <Eye size={14} />
                    <span>{formatNumber(viewCount)}</span>
                  </div>
                )}
                {bookmarksCount > 0 && (
                  <div className="flex items-center text-xs text-muted-foreground whitespace-nowrap shrink-0 gap-1">
                    <Bookmark size={14} className="text-muted-foreground" />
                    <span>{formatNumber(bookmarksCount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onSelect={() => window.open(componentUrl, "_blank")}>
          Open in new tab
        </ContextMenuItem>
        <ContextMenuItem onSelect={handleCopyLink}>Copy link</ContextMenuItem>
        <ContextMenuItem onSelect={handleBookmark}>
          Save for later
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Copy prompt</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-64">
            {promptOptions
              .filter(
                (
                  option,
                ): option is Extract<
                  typeof option,
                  { type: "option" | "separator" }
                > => option.type === "option" || option.type === "separator",
              )
              .map((option) =>
                option.type === "separator" ? (
                  <ContextMenuSeparator key={option.id} />
                ) : (
                  <ContextMenuItem
                    key={option.id}
                    onSelect={() => handleCopyPrompt(option.id as PromptType)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px] mt-0.5 flex items-center justify-center">
                        {option.icon}
                      </div>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </div>
                  </ContextMenuItem>
                ),
              )}
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  )
}
