"use client"

import AdminHeader from "@/components/features/admin/AdminHeader"
import EditDemoModal from "@/components/features/admin/EditDemoModal"
import ManageSubmissionModal from "@/components/features/admin/ManageSubmissionModal"
import NonAdminPlaceholder from "@/components/features/admin/NonAdminPlaceholder"
import SubmissionStatusFilter from "@/components/features/admin/SubmissionStatusFilter"
import useSubmissions from "@/components/features/admin/hooks/useSubmissions"
import { useIsAdmin } from "@/components/features/publish/hooks/use-is-admin"
import { motion } from "motion/react"
import { FC, useRef, useCallback, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Edit, ExternalLink, Settings, Star, Eye, Video } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

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
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
        </div>
      )}
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

interface PreviewHoverContentProps {
  preview_url: string
  video_url?: string
  name: string
}

const PreviewHoverContent: FC<PreviewHoverContentProps> = ({
  preview_url,
  video_url,
  name,
}) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleMouseEnter = () => {
    if (video_url && videoRef.current) {
      videoRef.current.play()
      setIsVideoPlaying(true)
    }
  }

  const handleMouseLeave = () => {
    if (video_url && videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setIsVideoPlaying(false)
    }
  }

  return (
    <div
      className="relative w-[400px] aspect-video rounded-lg overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img
        src={preview_url || "/placeholder.svg"}
        alt={name}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isVideoPlaying ? "opacity-0" : "opacity-100",
        )}
      />

      {video_url && (
        <video
          ref={videoRef}
          src={video_url}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            isVideoPlaying ? "opacity-100" : "opacity-0",
          )}
          loop
          muted
          playsInline
          preload="none"
        />
      )}

      {video_url && !isVideoPlaying && (
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-sm px-2 py-1 rounded-md">
          Hover to play
        </div>
      )}
    </div>
  )
}

const SubmissionsAdminPage: FC = () => {
  const isAdmin = useIsAdmin()
  const {
    submissions,
    loading,
    filter,
    selectedSubmission,
    feedback,
    editingDemo,
    editDemoName,
    editDemoSlug,
    setFilter,
    setFeedback,
    setSelectedSubmission,
    setEditDemoName,
    setEditDemoSlug,
    setEditingDemo,
    fetchSubmissions,
    updateSubmissionStatus,
    updateDemoInfo,
    handleSelectSubmission,
    handleEditDemo,
    handleSetDefaultDemo,
    getStatusAsEnum,
  } = useSubmissions(isAdmin)

  // Non-admin placeholder
  if (!isAdmin) {
    return <NonAdminPlaceholder />
  }

  const getStatusBadgeClass = (status: string | null) => {
    if (!status) return "bg-gray-200 text-gray-800"

    switch (status) {
      case "on_review":
        return "bg-yellow-200 text-yellow-800"
      case "posted":
        return "bg-green-200 text-green-800"
      case "rejected":
        return "bg-red-200 text-red-800"
      default:
        return "bg-blue-200 text-blue-800"
    }
  }

  return (
    <div className="container py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AdminHeader
          title="Component Submissions"
          subtitle="Manage submitted components from users"
        />

        <div className="flex justify-end mb-4">
          <SubmissionStatusFilter
            value={filter}
            onChange={setFilter}
            onRefresh={fetchSubmissions}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="w-full overflow-auto">
            {submissions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">No submissions found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Component</TableHead>
                    <TableHead className="min-w-[300px]">
                      Demo & Actions
                    </TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>DB Links</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => {
                    // Supabase URLs
                    const componentSupabaseUrl = `https://supabase.com/dashboard/project/vucvdpamtrjkzmubwlts/editor/29179?sort=created_at%3Adesc&filter=id%3Aeq%3A${submission.component_data.id}`
                    const demoSupabaseUrl = `https://supabase.com/dashboard/project/vucvdpamtrjkzmubwlts/editor/229472?sort=created_at:desc&filter=component_id:eq:${submission.component_data.id}`
                    const viewUrl = `/${submission.user_data.username}/${submission.component_data.component_slug}/${submission.demo_slug}`

                    return (
                      <TableRow
                        key={submission.id}
                        className="group cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          window.open(viewUrl, "_blank")
                        }}
                      >
                        <TableCell>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="group relative w-24 h-16 rounded-lg overflow-hidden">
                                <div className="absolute inset-0">
                                  <img
                                    src={
                                      submission.preview_url ||
                                      "/placeholder.svg"
                                    }
                                    alt={submission.name || "Preview"}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                </div>

                                {submission.video_url && (
                                  <VideoPreview
                                    videoUrl={submission.video_url}
                                    id={submission.id}
                                  />
                                )}

                                <div className="absolute top-1 left-1 z-20">
                                  {submission.video_url && (
                                    <div
                                      className="bg-background/70 backdrop-blur rounded-sm p-0.5"
                                      data-video-icon={submission.id}
                                    >
                                      <Video
                                        size={12}
                                        className="text-foreground"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent
                              side="right"
                              align="start"
                              className="p-0 border-none shadow-2xl"
                            >
                              <PreviewHoverContent
                                preview_url={
                                  submission.preview_url || "/placeholder.svg"
                                }
                                video_url={submission.video_url}
                                name={submission.name || "Preview"}
                              />
                            </HoverCardContent>
                          </HoverCard>
                        </TableCell>

                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{submission.component_data.name}</span>
                            <span className="text-xs text-gray-500 font-mono">
                              ID: {submission.component_data.id}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {/* Demo Info */}
                              <div>
                                {submission.name ? (
                                  <div className="flex flex-col">
                                    <span>{submission.name}</span>
                                    <span className="text-xs text-gray-500 font-mono">
                                      {submission.demo_slug || "—"}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">—</span>
                                )}
                              </div>

                              {/* Demo Actions */}
                              <TooltipProvider>
                                <div
                                  className="flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          handleEditDemo(submission)
                                        }
                                        className="h-7 w-7"
                                      >
                                        <Edit size={14} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit Demo Info</p>
                                    </TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          handleSetDefaultDemo(submission)
                                        }
                                        className="h-7 w-7"
                                      >
                                        <Star size={14} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Set Default Demo</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TooltipProvider>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {submission.user_data.display_name ||
                            submission.user_data.username}
                        </TableCell>

                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="p-0 h-auto hover:bg-transparent"
                                  onClick={() =>
                                    handleSelectSubmission(submission)
                                  }
                                >
                                  <Badge
                                    className={cn(
                                      getStatusBadgeClass(
                                        submission.submission_status,
                                      ),
                                      "cursor-pointer hover:opacity-80",
                                    )}
                                  >
                                    {submission.submission_status ||
                                      "No Status"}
                                  </Badge>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Click to manage submission</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>

                        <TableCell>
                          {new Date(submission.updated_at).toLocaleDateString()}
                        </TableCell>

                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <TooltipProvider>
                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    asChild
                                    className="h-8 w-8"
                                  >
                                    <Link
                                      href={componentSupabaseUrl}
                                      target="_blank"
                                    >
                                      <ExternalLink
                                        size={16}
                                        className="text-blue-600"
                                      />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Open Component in Supabase</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    asChild
                                    className="h-8 w-8"
                                  >
                                    <Link
                                      href={demoSupabaseUrl}
                                      target="_blank"
                                    >
                                      <ExternalLink
                                        size={16}
                                        className="text-green-600"
                                      />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Open Demo in Supabase</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* Modals */}
        {selectedSubmission && (
          <ManageSubmissionModal
            submission={selectedSubmission}
            feedback={feedback}
            onFeedbackChange={setFeedback}
            onStatusChange={(status) => {
              setSelectedSubmission({
                ...selectedSubmission,
                submission_status: status,
              })
            }}
            onClose={() => {
              setSelectedSubmission(null)
              setFeedback("")
            }}
            onSave={() =>
              updateSubmissionStatus(
                selectedSubmission.component_data.id,
                getStatusAsEnum(selectedSubmission.submission_status),
              )
            }
          />
        )}

        {editingDemo && (
          <EditDemoModal
            submission={editingDemo}
            demoName={editDemoName}
            demoSlug={editDemoSlug}
            onDemoNameChange={setEditDemoName}
            onDemoSlugChange={setEditDemoSlug}
            onClose={() => {
              setEditingDemo(null)
              setEditDemoName("")
              setEditDemoSlug("")
            }}
            onSave={updateDemoInfo}
          />
        )}
      </motion.div>
    </div>
  )
}

export default SubmissionsAdminPage
