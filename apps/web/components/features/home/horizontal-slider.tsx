"use client"

import React, { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Link } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ComponentCard } from "@/components/features/list-card/card"
import { DemoWithComponent } from "@/types/global"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ComponentCardSkeleton } from "@/components/ui/skeletons"

interface HorizontalSliderProps {
  title: string
  items: DemoWithComponent[]
  isLoading?: boolean
  viewAllLink?: string
  onViewAll?: () => void
  className?: string
  totalCount?: number
}

export function HorizontalSlider({
  title,
  items,
  isLoading = false,
  viewAllLink,
  onViewAll,
  className,
  totalCount,
}: HorizontalSliderProps) {
  const router = useRouter()
  const [showLeftButton, setShowLeftButton] = useState(false)
  const [showRightButton, setShowRightButton] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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
    // Initial check
    checkScroll()

    // Also check when window resizes
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
    // Always prevent default
    e.preventDefault()
    e.stopPropagation()

    console.log("View All clicked")

    if (onViewAll) {
      console.log("Calling onViewAll function")
      onViewAll()
    }
  }

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {(viewAllLink || onViewAll) && (
          <Button
            variant="link"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors p-0 h-auto cursor-pointer"
            asChild={!onViewAll}
            onClick={handleViewAllClick}
          >
            {onViewAll ? (
              <span className="cursor-pointer flex items-center group">
                View all
                {totalCount !== undefined && (
                  <span className="ml-1 text-muted-foreground group-hover:text-foreground">
                    ({totalCount})
                  </span>
                )}
                <ChevronRight className="ml-1 h-4 w-4" />
              </span>
            ) : (
              <Link href={viewAllLink} className="flex items-center gap-1 group">
                View all
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
        <ScrollArea ref={scrollAreaRef} className="w-full pb-4 -mx-1 px-1">
          <div
            ref={scrollContainerRef}
            className="flex space-x-4"
            style={{
              minWidth: "100%",
              paddingLeft: "1px", // Prevent edge components from being cut off
              paddingRight: "1px",
            }}
          >
            {isLoading ? (
              // Loading placeholders using ComponentCardSkeleton
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`slider-skeleton-${i}`}
                  className="min-w-[280px] max-w-[280px]"
                >
                  <ComponentCardSkeleton />
                </div>
              ))
            ) : items.length === 0 ? (
              <div className="min-w-full flex items-center justify-center h-60 text-muted-foreground">
                No items to display
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`slider-item-${item.id}`}
                  className="min-w-[280px] max-w-[280px]"
                >
                  <ComponentCard
                    demo={item}
                    onClick={() => {
                      if (item.bundle_url?.html) {
                        // Handle preview if needed
                        router.push(
                          `/${item.user.username}/${item.component.component_slug}/${item.demo_slug}`,
                        )
                      } else {
                        router.push(
                          `/${item.user.username}/${item.component.component_slug}/${item.demo_slug}`,
                        )
                      }
                    }}
                    onCtrlClick={(url) => {
                      window.open(url, "_blank")
                      toast.success(
                        `${item.component?.name || item.name} was opened in a new tab`,
                      )
                    }}
                  />
                </div>
              ))
            )}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>

        {/* Navigation buttons */}
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

        {/* Gradient masks */}
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
    </div>
  )
}
