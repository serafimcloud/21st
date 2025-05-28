"use client"

import AdminHeader from "@/components/features/admin/AdminHeader"
import { DbLinks } from "@/components/features/admin/db-links"
import DeleteComponentDialog from "@/components/features/admin/DeleteComponentDialog"
import EditDemoModal from "@/components/features/admin/EditDemoModal"
import useSubmissions from "@/components/features/admin/hooks/useSubmissions"
import ManageSubmissionModal from "@/components/features/admin/ManageSubmissionModal"
import NonAdminPlaceholder from "@/components/features/admin/NonAdminPlaceholder"
import PaginationControls from "@/components/features/admin/PaginationControls"
import SubmissionStatusFilter from "@/components/features/admin/SubmissionStatusFilter"
import { useIsAdmin } from "@/components/features/publish/hooks/use-is-admin"
import { Spinner } from "@/components/icons/spinner"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useDebouncedState } from "@/hooks/use-debounced-state"
import { transferOwnershipAction } from "@/lib/api/components"
import { getUsersAction } from "@/lib/api/users"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { CommandLoading } from "cmdk"
import {
  Award,
  Check,
  ChevronDown,
  Edit,
  Globe,
  Lock,
  Star,
  Trash,
  UserCheck,
  Video,
} from "lucide-react"
import { motion } from "motion/react"
import { FC, useCallback, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

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

// RoundToggle component for switching contest rounds
const RoundToggle = ({
  submission,
  allRounds,
  onAddToContest,
  isUpdating,
  contestDemoId,
  getRoundById,
}: {
  submission: any
  allRounds: any[]
  onAddToContest: (demoId: number, roundId: number) => void
  isUpdating: boolean
  contestDemoId: number | null
  getRoundById: (roundId: number | null) => any | null
}) => {
  const [open, setOpen] = useState(false)
  const isInContest = !!submission.contest_round_id
  const contestRoundId = submission.contest_round_id ?? null
  const contestRound = isInContest ? getRoundById(contestRoundId) : null
  const canAddToContest = submission.submission_status === "posted"

  // For demo already in contest, show the current round with ability to change
  if (isInContest) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "gap-1 rounded-md h-7 focus:ring-0 text-xs px-2 justify-between",
              {
                "bg-purple-100/70 text-purple-800 border-purple-200":
                  contestRound?.week_number % 4 === 0,
                "bg-blue-100/70 text-blue-800 border-blue-200":
                  contestRound?.week_number % 4 === 1,
                "bg-green-100/70 text-green-800 border-green-200":
                  contestRound?.week_number % 4 === 2,
                "bg-orange-100/70 text-orange-800 border-orange-200":
                  contestRound?.week_number % 4 === 3,
              },
            )}
          >
            <div className="flex items-center gap-1">
              <Award size={12} className="min-w-3 min-h-3" />
              <span>Week #{contestRound?.week_number || "?"}</span>
            </div>
            <ChevronDown
              size={14}
              className="shrink-0 opacity-80"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="bg-popover text-popover-foreground border-border w-auto p-0"
          align="start"
        >
          <Command className="text-xs">
            <CommandInput
              placeholder="Search weeks..."
              className="text-xs h-7 py-1"
            />
            <CommandList>
              <CommandEmpty>No rounds found.</CommandEmpty>
              <CommandGroup>
                {allRounds.map((round) => (
                  <CommandItem
                    key={round.id}
                    value={round.id.toString()}
                    onSelect={(value) => {
                      onAddToContest(submission.id, Number(value))
                      setOpen(false)
                    }}
                    className="cursor-pointer text-xs py-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <Award size={12} className="min-w-3 min-h-3" />
                      <span>Week #{round.week_number}</span>
                    </div>
                    {contestRoundId === round.id && (
                      <Check size={14} className="ml-auto text-purple-600" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  // For demo not in contest, show the "Add to Contest" button that opens popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={!canAddToContest || isUpdating}
          className="bg-card text-card-foreground border-border h-7 text-xs px-2 justify-between gap-1"
        >
          <div className="flex items-center gap-1.5">
            <Award size={12} className="min-w-3 min-h-3" />
            <span>
              {isUpdating && contestDemoId === submission.id
                ? "Adding..."
                : "Add to Contest"}
            </span>
          </div>
          <ChevronDown
            size={14}
            className="text-muted-foreground/80 shrink-0"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="bg-popover text-popover-foreground border-border w-[230px] p-0"
        align="start"
      >
        <Command className="text-xs">
          <CommandInput
            placeholder="Search weeks..."
            className="text-xs h-7 py-1"
          />
          <CommandList>
            <CommandEmpty>No rounds found.</CommandEmpty>
            <CommandGroup>
              {allRounds.map((round) => (
                <CommandItem
                  key={round.id}
                  value={round.id.toString()}
                  onSelect={(value) => {
                    onAddToContest(submission.id, Number(value))
                    setOpen(false)
                  }}
                  className="cursor-pointer text-xs py-1"
                >
                  <div className="flex items-center gap-1.5">
                    <Award size={12} className="min-w-3 min-h-3" />
                    <span>
                      Week #{round.week_number} (
                      {new Date(round.start_at).toLocaleDateString()} -{" "}
                      {new Date(round.end_at).toLocaleDateString()})
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// UserPicker component for transferring ownership
const UserPickerPopover = ({
  componentId,
  disabled,
}: {
  componentId: number
  disabled?: boolean
}) => {
  const [open, setOpen] = useState(false)
  const [search, debouncedSearch, setSearch] = useDebouncedState<string>(
    "",
    1000,
  )

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", debouncedSearch],
    queryFn: async () => {
      if (debouncedSearch.length === 0) {
        return []
      }
      return await getUsersAction({
        searchQuery: debouncedSearch,
      })
    },
  })

  const options = useMemo(() => {
    return (
      users?.map((user) => ({
        value: user.id,
        user,
      })) ?? []
    )
  }, [users])

  const handleUserSelect = async (userId: string) => {
    toast.promise(transferOwnershipAction({ componentId, userId }), {
      loading: "Transferring ownership...",
      success: "Ownership transferred successfully",
      error: "Failed to transfer ownership",
    })
    setOpen(false)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled}
                className="h-8 w-8"
              >
                <UserCheck size={16} className="text-blue-600" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-0 w-[300px]">
              <Command shouldFilter={false} className="max-h-[200px]">
                <CommandInput
                  placeholder="Search users..."
                  value={search}
                  onValueChange={(value) => setSearch(value)}
                />
                <CommandList>
                  {!isLoading && (
                    <CommandEmpty>No users or empty search</CommandEmpty>
                  )}
                  {isLoading && (
                    <CommandLoading className="flex items-center justify-center p-4">
                      <Spinner size={16} />
                    </CommandLoading>
                  )}
                  <CommandGroup>
                    {options.map((option) => {
                      return (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={(value) => {
                            handleUserSelect(value)
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={
                                  option.user.display_image_url ??
                                  option.user.image_url ??
                                  ""
                                }
                              />
                            </Avatar>
                            <div className="flex flex-row gap-2">
                              <p>{option.user.username}</p>
                              <p className="text-muted-foreground">
                                {option.user.display_username}
                              </p>
                            </div>
                          </div>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </TooltipTrigger>
        <TooltipContent>
          <p>Transfer Ownership</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
    currentRound,
    allRounds,
    isCurrentRoundLoading,
    isAllRoundsLoading,
    contestRoundLoading,
    isDeletingComponent,
    componentToDelete,
    // Pagination state
    currentPage,
    itemsPerPage,
    totalCount,
    totalPages,
    // State setters
    setFilter,
    setFeedback,
    setSelectedSubmission,
    setEditDemoName,
    setEditDemoSlug,
    setEditingDemo,
    setComponentToDelete,
    // Functions
    fetchSubmissions,
    updateSubmissionStatus,
    updateDemoInfo,
    handleSelectSubmission,
    handleEditDemo,
    handleSetDefaultDemo,
    getStatusAsEnum,
    addToContest,
    getRoundById,
    toggleComponentPublicStatus,
    deleteComponent,
    // Pagination handlers
    goToPage,
    goToNextPage,
    goToPreviousPage,
    changeItemsPerPage,
  } = useSubmissions(isAdmin)

  const [contestDemoId, setContestDemoId] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Handle adding to a contest
  const handleAddToContest = (demoId: number, roundId: number) => {
    if (!roundId) {
      toast.error("Please select a contest round")
      return
    }
    setContestDemoId(demoId)
    addToContest(demoId, roundId)
  }

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
        className="h-full"
      >
        <AdminHeader
          title="Component Submissions"
          subtitle="Manage submitted components from users"
        />

        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-muted-foreground">
            {totalCount > 0 && <>Total: {totalCount} submissions</>}
          </div>
          <SubmissionStatusFilter
            value={filter}
            onChange={setFilter}
            onRefresh={fetchSubmissions}
          />
        </div>

        {loading || isAllRoundsLoading ? (
          <div className="py-10 flex justify-center items-center h-full">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <>
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
                      <TableHead>Website</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>DB Links</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => {
                      const viewUrl = `/${submission.user_data.username}/${submission.component_data.component_slug}/${submission.demo_slug}`

                      // Check if the submission is already in a contest - using the demo ID (submission.id)
                      const isInContest = !!submission.contest_round_id
                      // Whether this submission can be added to the current contest
                      const canAddToContest =
                        submission.submission_status === "posted" &&
                        !isInContest
                      // Get round details if in a contest
                      const contestRoundId = submission.contest_round_id ?? null
                      const contestRound = isInContest
                        ? getRoundById(contestRoundId)
                        : null

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

                          <TableCell>
                            {submission.component_data.website_url ? (
                              <a
                                href={submission.component_data.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline text-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {submission.component_data.website_url.length >
                                30
                                  ? `${submission.component_data.website_url.substring(0, 30)}...`
                                  : submission.component_data.website_url}
                              </a>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
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

                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      toggleComponentPublicStatus(
                                        submission.component_data.id,
                                        submission.is_public || false,
                                      )
                                    }
                                    className="h-8 w-8"
                                  >
                                    {submission.is_public ? (
                                      <Globe
                                        size={16}
                                        className="text-green-600"
                                      />
                                    ) : (
                                      <Lock
                                        size={16}
                                        className="text-orange-600"
                                      />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {submission.is_public
                                      ? "Make Private"
                                      : "Make Public"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>

                          <TableCell>
                            {new Date(
                              submission.updated_at,
                            ).toLocaleDateString()}
                          </TableCell>

                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DbLinks
                              componentId={submission.component_data.id}
                            />
                          </TableCell>

                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <UserPickerPopover
                              componentId={submission.component_data.id}
                              disabled={!submission.component_data.id}
                            />
                          </TableCell>

                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setComponentToDelete(submission)
                                      setShowDeleteDialog(true)
                                    }}
                                    className="h-8 w-8"
                                  >
                                    <Trash
                                      size={16}
                                      className="text-destructive"
                                    />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete Component</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Pagination Controls */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={goToPage}
              onItemsPerPageChange={changeItemsPerPage}
              loading={loading}
            />
          </>
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

        {componentToDelete && (
          <DeleteComponentDialog
            isOpen={showDeleteDialog}
            onClose={() => {
              setShowDeleteDialog(false)
              setComponentToDelete(null)
            }}
            onDelete={async (mode) => {
              await deleteComponent(componentToDelete, mode)
            }}
            componentName={componentToDelete.component_data.name}
            isDeleting={isDeletingComponent}
          />
        )}
      </motion.div>
    </div>
  )
}

export default SubmissionsAdminPage
