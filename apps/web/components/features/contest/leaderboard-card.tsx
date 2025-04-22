"use client"

import React, { useRef, useCallback, useState } from "react"
import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ThumbsUp, ExternalLink, Video } from "lucide-react"
import { cn } from "@/lib/utils"

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
}

export function LeaderboardCard({
  submission,
  index,
  isVoting,
  handleVote,
  handleDemoClick,
}: LeaderboardCardProps) {
  const userData = submission.user_data || {}
  const componentData = submission.component_data || {}
  const tags = submission.tags || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => handleDemoClick(submission)}
    >
      <div className="group relative flex flex-row items-start gap-4 rounded-xl px-0 py-4 transition-all duration-300 sm:-mx-4 sm:p-4 cursor-pointer hover:sm:bg-gray-100 dark:hover:sm:bg-gray-800">
        {/* Left - Preview Image with Video */}
        <div className="relative aspect-[4/3] w-32 rounded-lg overflow-hidden shrink-0 group">
          <div className="absolute inset-0">
            <img
              src={submission.preview_url || "/placeholder.svg"}
              alt={submission.name}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div className="absolute inset-0 rounded-lg" />

          {submission.video_url && (
            <VideoPreview videoUrl={submission.video_url} id={submission.id} />
          )}

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

        {/* Middle - Content */}
        <div className="flex flex-1 flex-col">
          {/* Title and External Link */}
          <div className="flex items-center">
            <h3 className="text-base font-semibold text-foreground group-hover:text-primary">
              {index + 1}. {submission.name}
            </h3>
            <ExternalLink className="relative hidden h-3.5 w-3.5 cursor-pointer px-1 text-muted-foreground transition-all hover:text-primary group-hover:inline-block ml-1" />
          </div>

          {/* Description */}
          <p className="text-base text-muted-foreground">
            {componentData.name || "No description"}
          </p>

          {/* Tags */}
          <div className="mt-1 flex flex-row flex-wrap items-center gap-2">
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

        {/* Right - Stats */}
        <div className="flex flex-row gap-2">
          {/* Votes */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "size-12 rounded-xl border-2 transition-colors duration-200",
                submission.has_voted
                  ? "border-primary bg-primary/10"
                  : "hover:border-primary",
              )}
              onClick={(e) => handleVote(e, submission.id)}
              disabled={isVoting}
              aria-label={submission.has_voted ? "Remove vote" : "Vote"}
            >
              <div className="flex flex-col items-center gap-1">
                {isVoting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={submission.has_voted ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <ThumbsUp
                      className={cn(
                        "h-3.5 w-3.5 transition-colors",
                        submission.has_voted
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />
                  </motion.div>
                )}
                <motion.div
                  key={`votes-${submission.votes || 0}`}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-semibold leading-none"
                >
                  {submission.votes || 0}
                </motion.div>
              </div>
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
