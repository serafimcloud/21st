"use client"

import React, { useRef, useCallback, useState } from "react"
import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Video, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserAvatar } from "../../ui/user-avatar"
import { UpvoteIcon } from "../../icons/upvote-icon"
import { shouldHideLeaderboardRankings } from "@/lib/utils"
import NumberFlow from "@number-flow/react"

// VideoPreview component for hover video functionality
const videoLoadingCache = new Map<string, boolean>()
const videoLoadPromises = new Map<string, Promise<void>>()

function VideoPreview({ videoUrl, id }: { videoUrl: string; id: number }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const toggleVideoIcon = useCallback(
    (hide: boolean) => {
      const videoIcon = document.querySelector(
        `[data-video-icon="${id}"]`,
      ) as HTMLElement
      if (videoIcon) {
        videoIcon.style.opacity = hide ? "0" : "1"
        videoIcon.style.visibility = hide ? "hidden" : "visible"
      }
    },
    [id],
  )

  const loadVideo = useCallback(async () => {
    const videoElement = videoRef.current
    if (!videoElement || !videoUrl) return

    if (videoLoadPromises.has(videoUrl)) {
      try {
        setIsLoading(true)
        await videoLoadPromises.get(videoUrl)
        if (videoLoadingCache.get(videoUrl)) {
          videoElement.currentTime = 0
          videoElement.play().catch(() => {})
        }
      } catch (error) {
        console.error("Error loading video:", error)
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (!isVideoLoaded && !videoLoadingCache.get(videoUrl)) {
      setIsLoading(true)

      const loadPromise = new Promise<void>((resolve, reject) => {
        const handleLoad = () => {
          videoElement
            .play()
            .then(() => {
              setIsVideoLoaded(true)
              videoLoadingCache.set(videoUrl, true)
              resolve()
            })
            .catch(reject)
        }

        videoElement.addEventListener("loadeddata", handleLoad, { once: true })
        videoElement.src = videoUrl
        videoElement.load()
      })

      videoLoadPromises.set(videoUrl, loadPromise)

      try {
        await loadPromise
      } catch (error) {
        console.error("Error loading video:", error)
        videoLoadingCache.set(videoUrl, false)
      } finally {
        videoLoadPromises.delete(videoUrl)
        setIsLoading(false)
      }
    } else if (isVideoLoaded) {
      videoElement.currentTime = 0
      videoElement.play().catch(() => {})
    }
  }, [videoUrl, isVideoLoaded])

  const playVideo = useCallback(() => {
    toggleVideoIcon(true)
    loadVideo()
  }, [toggleVideoIcon, loadVideo])

  const stopVideo = useCallback(() => {
    toggleVideoIcon(false)
    const videoElement = videoRef.current
    if (videoElement) {
      videoElement.pause()
    }
  }, [toggleVideoIcon])

  return (
    <div
      onMouseEnter={playVideo}
      onMouseLeave={stopVideo}
      onTouchStart={playVideo}
      onTouchEnd={stopVideo}
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    >
      {isLoading && <div className="loading-border" />}
      <video
        ref={videoRef}
        data-video={`${id}`}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        className="absolute inset-0 w-full h-full object-cover rounded-lg"
      />
    </div>
  )
}

// Main LeaderboardCard component
interface LeaderboardCardProps {
  submission: any
  index: number
  isVoting: boolean
  handleVote: (e: React.MouseEvent, demoId: number) => Promise<void>
  handleDemoClick: (submission: any) => void
  isHistorical?: boolean
}

export function LeaderboardCard({
  submission,
  index,
  isVoting,
  handleVote,
  handleDemoClick,
  isHistorical = false,
}: LeaderboardCardProps) {
  const userData = submission.user_data || {}
  const componentData = submission.component_data || {}
  const tags = submission.tags || []

  // Use the shared utility function
  const hideRankings = shouldHideLeaderboardRankings() && !isHistorical

  const formatNumber = (num: number) => {
    if (num === undefined || num === null || isNaN(num)) {
      return "0"
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  return (
    <div onClick={() => handleDemoClick(submission)}>
      <div className="group relative flex flex-col sm:flex-row items-start gap-4 rounded-xl px-0 py-4 transition-all duration-300 sm:-mx-4 sm:p-4 cursor-pointer hover:sm:bg-transparent dark:hover:sm:bg-transparent">
        {/* Preview Image with Video (Top on mobile, Left on desktop) */}
        <div className="relative aspect-[4/3] w-full sm:w-56 mb-4 sm:mb-0">
          <div className="absolute inset-0">
            <div className="relative w-full h-full rounded-lg shadow-base overflow-hidden">
              <img
                src={submission.preview_url || "/placeholder.svg"}
                alt={submission.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0" />

              {submission.video_url && (
                <VideoPreview
                  videoUrl={submission.video_url}
                  id={submission.id}
                />
              )}
            </div>
          </div>

          <div className="absolute top-2 left-2 z-20 flex gap-2">
            {submission.video_url && (
              <div
                className="bg-background/90 backdrop-blur rounded-sm px-2 py-1 pointer-events-none"
                data-video-icon={submission.id}
              >
                <Video size={16} className="text-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Content Area (Below Preview on mobile, middle on desktop) */}
        <div className="flex-1 flex flex-row justify-between w-full">
          {/* Left column (Title, Author, Tags) */}
          <div className="flex flex-col space-y-2 flex-1 sm:min-h-24 justify-between">
            <div className="space-y-1">
              {/* Title - hide the ranking number before Thursday */}
              <h3 className="text-base font-semibold text-foreground group-hover:text-primary">
                {!hideRankings ? `${index + 1}. ` : ""}
                {componentData.name || submission.name}
              </h3>

              {/* Description */}
              {submission.name !== "Default" && (
                <p className="text-base text-muted-foreground">
                  {submission.name}
                </p>
              )}

              {/* User Avatar */}
              <div className="flex items-center gap-2">
                <UserAvatar
                  src={userData.image_url || "/placeholder.svg"}
                  alt={userData.name || "User"}
                  size={20}
                  user={userData}
                  isClickable
                />
                <span className="text-sm text-muted-foreground">
                  {userData.name || userData.username || "Anonymous"}
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-row flex-wrap items-center gap-2 mt-2">
              <Tag size={14} className="text-muted-foreground" />
              {Array.isArray(tags) &&
                tags.map((tag, tagIndex) => (
                  <Badge
                    key={typeof tag === "string" ? tag : tag.slug || tagIndex}
                    variant="outline"
                    className="text-xs font-normal hover:bg-secondary"
                  >
                    {typeof tag === "string" ? tag : tag.slug || "unknown"}
                  </Badge>
                ))}
            </div>
          </div>

          {/* Votes (Right on both mobile and desktop) - Hide completely for historical views */}
          {!isHistorical && (
            <div className="flex ml-4 shrink-0">
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "size-12 rounded-lg border transition-colors duration-200",
                  submission.has_voted
                    ? "border-primary bg-muted/20 text-primary"
                    : "hover:border-primary hover:bg-primary/10 border-primary/50",
                )}
                onClick={(e) => handleVote(e, submission.id)}
                disabled={isVoting}
                aria-label={submission.has_voted ? "Remove vote" : "Vote"}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  {isVoting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <motion.div
                      initial={{ scale: 1 }}
                      animate={
                        submission.has_voted ? { scale: [1, 1.1, 1] } : {}
                      }
                      transition={{ duration: 0.2 }}
                    >
                      <UpvoteIcon isVoted={submission.has_voted} size={14} />
                    </motion.div>
                  )}
                  {/* Only show vote counts on Thursday */}
                  {!hideRankings && (
                    <div className="text-sm font-semibold leading-none h-[18px]">
                      <NumberFlow
                        value={Number(formatNumber(submission.votes || 0))}
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
                    </div>
                  )}
                </div>
              </Button>
            </div>
          )}

          {/* Show vote count as a simple text for historical views */}
          {isHistorical && (
            <div className="flex items-center gap-1 ml-4">
              <UpvoteIcon size={14} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium">
                <NumberFlow
                  value={Number(formatNumber(submission.votes || 0))}
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
