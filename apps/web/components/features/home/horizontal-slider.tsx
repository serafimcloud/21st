"use client"

import { ComponentPreviewDialog } from "@/components/features/component-page/preview-dialog"
import { ComponentCard } from "@/components/features/list-card/card"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ComponentCardSkeleton } from "@/components/ui/skeletons"
import { cn, shouldHideLeaderboardRankings } from "@/lib/utils"
import { DemoWithComponent } from "@/types/global"
import { useUser } from "@clerk/nextjs"
import { ChevronLeft, ChevronRight, Link } from "lucide-react"
import { useRouter } from "next/navigation"
import React, { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface HorizontalSliderProps {
  title: string
  items: DemoWithComponent[] | undefined
  isLoading?: boolean
  viewAllLink?: string
  viewAllUrl?: string
  onViewAll?: () => void
  className?: string
  totalCount?: number
  isLeaderboard?: boolean
  onVote?: (demoId: number) => Promise<void>
  hideUser?: boolean
  leftSide?: React.ReactNode
  rightSide?: React.ReactNode
}

export function HorizontalSlider({
  title,
  items,
  isLoading = false,
  viewAllLink,
  viewAllUrl,
  onViewAll,
  className,
  totalCount,
  isLeaderboard = false,
  onVote,
  hideUser,
  rightSide,
  leftSide,
}: HorizontalSliderProps) {
  const router = useRouter()
  const { user } = useUser()
  const [showLeftButton, setShowLeftButton] = useState(false)
  const [showRightButton, setShowRightButton] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [selectedDemo, setSelectedDemo] = useState<DemoWithComponent | null>(
    null,
  )
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)

  // Ensure items is always an array
  const safeItems = items || []

  // Check if we need to hide leaderboard rankings & votes
  const hideLeaderboardRankings = shouldHideLeaderboardRankings()

  useEffect(() => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return

    const viewport = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null

    if (!viewport) return

    const checkScroll = () => {
      setShowLeftButton(viewport.scrollLeft > 20)
      setShowRightButton(
        Math.ceil(viewport.scrollLeft + viewport.clientWidth) <
          viewport.scrollWidth - 20,
      )
    }

    viewport.addEventListener("scroll", checkScroll)
    checkScroll()

    window.addEventListener("resize", checkScroll)

    return () => {
      viewport.removeEventListener("scroll", checkScroll)
      window.removeEventListener("resize", checkScroll)
    }
  }, [items])

  const handleScrollLeft = () => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return

    const viewport = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null

    if (!viewport) return

    const scrollAmount = viewport.clientWidth * 0.75
    viewport.scrollBy({ left: -scrollAmount, behavior: "smooth" })
  }

  const handleScrollRight = () => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return

    const viewport = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null

    if (!viewport) return

    const scrollAmount = viewport.clientWidth * 0.75
    viewport.scrollBy({ left: scrollAmount, behavior: "smooth" })
  }

  const handleViewAllClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (onViewAll) {
      onViewAll()
    } else if (viewAllUrl) {
      router.push(viewAllUrl)
    }
  }

  const handleCardClick = (demo: DemoWithComponent) => {
    if (
      demo?.bundle_url &&
      typeof demo.bundle_url === "object" &&
      "html" in demo.bundle_url &&
      demo.bundle_url.html &&
      false // TODO: Temporary disable previews
    ) {
      setSelectedDemo(demo)
      setIsPreviewDialogOpen(true)
    } else {
      router.push(
        `/${demo.user.username}/${demo.component.component_slug}/${demo.demo_slug || "default"}`,
      )
    }
  }

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      <div className="flex items-center justify-between">
        {leftSide ? (
          <div>{leftSide}</div>
        ) : (
          <h2 className="font-semibold">{title}</h2>
        )}
        <div>{rightSide}</div>
        {(viewAllLink || onViewAll || viewAllUrl) && (
          <Button
            variant="link"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors p-0 h-auto cursor-pointer"
            asChild={!onViewAll && !viewAllUrl}
            onClick={handleViewAllClick}
          >
            {onViewAll || viewAllUrl ? (
              <span className="cursor-pointer flex items-center group">
                {isLeaderboard ? "View Leaderboard" : "View all"}
                {totalCount !== undefined && (
                  <span className="ml-1 text-muted-foreground group-hover:text-foreground">
                    ({totalCount})
                  </span>
                )}
                <ChevronRight className="ml-1 h-4 w-4" />
              </span>
            ) : (
              <Link
                href={viewAllLink}
                className="flex items-center gap-1 group"
              >
                {isLeaderboard ? "View Leaderboard" : "View all"}
                {totalCount !== undefined && (
                  <span className="ml-1 text-muted-foreground group-hover:text-foreground">
                    ({totalCount})
                  </span>
                )}
              </Link>
            )}
          </Button>
        )}
      </div>

      <div className="relative">
        <ScrollArea ref={scrollAreaRef} className="w-full -mx-1 px-1">
          <div
            ref={scrollContainerRef}
            className="flex space-x-4"
            style={{
              minWidth: "100%",
              paddingLeft: "1px",
              paddingRight: "1px",
            }}
          >
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`slider-skeleton-${i}`}
                  className="min-w-[280px] max-w-[280px]"
                >
                  <ComponentCardSkeleton />
                </div>
              ))
            ) : safeItems.length === 0 ? (
              <div className="min-w-full flex items-center justify-center h-60 text-muted-foreground">
                No items to display
              </div>
            ) : (
              safeItems.map((item) => (
                <div
                  key={`slider-item-${item.id}`}
                  className="min-w-[280px] max-w-[280px]"
                >
                  <ComponentCard
                    demo={item}
                    hideUser={hideUser}
                    onClick={() => handleCardClick(item)}
                    onCtrlClick={(url) => {
                      window.open(url, "_blank")
                      toast.success(
                        `${item.component?.name || item.name} was opened in a new tab`,
                      )
                    }}
                    hideVotes={isLeaderboard && hideLeaderboardRankings}
                    isLeaderboard={isLeaderboard}
                    onVote={isLeaderboard && user ? onVote : undefined}
                  />
                </div>
              ))
            )}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>

        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background shadow-md transition-opacity",
            showLeftButton ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
          onClick={handleScrollLeft}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background shadow-md transition-opacity",
            showRightButton ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
          onClick={handleScrollRight}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent transition-opacity",
            showLeftButton ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent transition-opacity",
            showRightButton ? "opacity-100" : "opacity-0",
          )}
        />
      </div>

      {selectedDemo && (
        <ComponentPreviewDialog
          isOpen={isPreviewDialogOpen}
          onClose={() => setIsPreviewDialogOpen(false)}
          demo={selectedDemo}
        />
      )}
    </div>
  )
}
