"use client"

import { cn } from "@/lib/utils"
import { categories } from "@/lib/navigation"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { Skeleton } from "@/components/ui/skeleton"
import { useAtom } from "jotai"
import { sidebarHintDismissedAtom, sidebarOpenAtom } from "./main-layout"
import { X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { SVGCategory } from "@/types/global"

const skeletonWidths = [
  "w-[115px]",
  "w-[55px]",
  "w-[40px]",
  "w-[140px]",
  "w-[98px]",
  "w-[84px]",
  "w-[76px]",
  "w-[92px]",
  "w-[68px]",
  "w-[120px]",
  "w-[88px]",
  "w-[104px]",
]

interface FilterChipsProps {
  activeTab: "categories" | "components" | "templates" | "logos"
  selectedFilter: string
  onFilterChange: (filter: string) => void
}

export function FilterChips({
  activeTab,
  selectedFilter,
  onFilterChange,
}: FilterChipsProps) {
  const [showLeftGradient, setShowLeftGradient] = useState(false)
  const [showRightGradient, setShowRightGradient] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const supabase = useClerkSupabaseClient()

  const { data: templateTags } = useQuery({
    queryKey: ["template-tags"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_template_tags")
      if (error) throw error
      return data
    },
    enabled: activeTab === "templates",
  })
  const { data: logoCategories, isLoading: isLogoCategoriesLoading } = useQuery(
    {
      queryKey: ["logo-categories"],
      queryFn: async () => {
        const response = await fetch("/api/svgl?type=categories")
        if (!response.ok) {
          throw new Error("Failed to fetch logo categories")
        }
        const data = await response.json()
        return data as SVGCategory[]
      },
      enabled: activeTab === "logos",
      staleTime: 1000 * 60 * 5,
    },
  )

  useEffect(() => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return

    const viewport = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]",
    )
    if (!viewport) return

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = viewport
      setShowLeftGradient(scrollLeft > 20)
      setShowRightGradient(
        Math.ceil(scrollLeft + clientWidth) < scrollWidth - 20,
      )
    }

    viewport.addEventListener("scroll", checkScroll)
    // Initial check
    checkScroll()

    return () => viewport.removeEventListener("scroll", checkScroll)
  }, [])

  const renderContent = () => {
    if (activeTab === "categories") {
      return (
        <>
          <Button
            onClick={() => onFilterChange("all")}
            variant={
              selectedFilter === "all" || !selectedFilter
                ? "default"
                : "outline"
            }
            className="rounded-full"
            size="sm"
          >
            All
          </Button>
          <Button
            onClick={() => onFilterChange("ui")}
            variant={selectedFilter === "ui" ? "default" : "outline"}
            className="rounded-full"
            size="sm"
          >
            UI Components
          </Button>
          <Button
            onClick={() => onFilterChange("marketing")}
            variant={selectedFilter === "marketing" ? "default" : "outline"}
            className="rounded-full"
            size="sm"
          >
            Marketing Blocks
          </Button>
        </>
      )
    }

    if (activeTab === "components") {
      const allTags = categories
        .reduce(
          (acc, category) => {
            category.items.forEach((item) => {
              if (!acc.some((tag) => tag.href === item.href)) {
                acc.push(item)
              }
            })
            return acc
          },
          [] as { title: string; href: string }[],
        )
        .sort((a, b) => a.title.localeCompare(b.title))

      const [hintDismissed, setHintDismissed] = useAtom(
        sidebarHintDismissedAtom,
      )
      const [, setSidebarOpen] = useAtom(sidebarOpenAtom)

      const [showHint, setShowHint] = useState(false)

      useEffect(() => {
        const timer = setTimeout(() => {
          setShowHint(true)
        }, 500)
        return () => clearTimeout(timer)
      }, [])

      return (
        <>
          <AnimatePresence mode="popLayout">
            <div className="flex items-center gap-2">
              {!hintDismissed && showHint && (
                <motion.div
                  className="relative items-center hidden md:flex"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  layout
                >
                  <Button
                    variant="outline"
                    className="rounded-full pr-8 cursor-pointer hover:bg-transparent"
                    size="sm"
                    onClick={() => {
                      setHintDismissed(true)
                      setSidebarOpen(true)
                    }}
                  >
                    <p className="flex items-center gap-1.5">
                      Reopen sidebar? Press
                      <kbd className="pointer-events-none h-5 text-foreground/80 select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 flex text-[11px] leading-none font-sans">
                        S
                      </kbd>
                    </p>

                    <div
                      className="absolute right-1 p-1 rounded-full hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation()
                        setHintDismissed(true)
                      }}
                    >
                      <X className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground" />
                    </div>
                  </Button>
                </motion.div>
              )}
              <motion.div
                layout
                className="flex items-center gap-2"
                transition={{
                  duration: 0.3,
                  layout: {
                    duration: 0.4,
                    ease: "easeOut",
                  },
                }}
              >
                <Button
                  onClick={() => onFilterChange("all")}
                  variant={
                    selectedFilter === "all" || !selectedFilter
                      ? "default"
                      : "outline"
                  }
                  className="rounded-full"
                  size="sm"
                >
                  All
                </Button>
                {allTags.map((tag) => {
                  const tagSlug = tag.href.split("/")[2] || ""
                  return (
                    <Button
                      key={tag.href}
                      onClick={() => onFilterChange(tagSlug)}
                      variant={
                        selectedFilter === tagSlug ? "default" : "outline"
                      }
                      className="rounded-full"
                      size="sm"
                    >
                      {tag.title}
                    </Button>
                  )
                })}
              </motion.div>
            </div>
          </AnimatePresence>
        </>
      )
    }

    if (activeTab === "templates") {
      return (
        <>
          <Button
            onClick={() => onFilterChange("all")}
            variant={
              selectedFilter === "all" || !selectedFilter
                ? "default"
                : "outline"
            }
            className="rounded-full"
            size="sm"
          >
            All
          </Button>
          {templateTags === undefined
            ? Array.from({ length: 20 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className={`h-8 rounded-full border border-input ${skeletonWidths[i % skeletonWidths.length]}`}
                />
              ))
            : templateTags?.map((tag) => (
                <Button
                  key={tag.tag_id}
                  onClick={() => onFilterChange(tag.tag_slug)}
                  variant={
                    selectedFilter === tag.tag_slug ? "default" : "outline"
                  }
                  className="rounded-full"
                  size="sm"
                >
                  {tag.tag_name}
                </Button>
              ))}
        </>
      )
    }

    if (activeTab === "logos") {
      return (
        <>
          <Button
            onClick={() => onFilterChange("all")}
            variant={
              selectedFilter === "all" || !selectedFilter
                ? "default"
                : "outline"
            }
            className="rounded-full"
            size="sm"
          >
            All
          </Button>
          {isLogoCategoriesLoading
            ? Array.from({ length: 12 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className={`h-8 rounded-full border border-input ${skeletonWidths[i % skeletonWidths.length]}`}
                />
              ))
            : logoCategories?.map((category) => (
                <Button
                  key={category.category}
                  onClick={() =>
                    onFilterChange(category.category.toLowerCase())
                  }
                  variant={
                    selectedFilter === category.category.toLowerCase()
                      ? "default"
                      : "outline"
                  }
                  className="rounded-full"
                  size="sm"
                >
                  {category.category}
                </Button>
              ))}
        </>
      )
    }

    return null
  }

  if (!activeTab) return null

  return (
    <div className="relative mb-3">
      <ScrollArea
        ref={scrollAreaRef}
        className="w-full whitespace-nowrap rounded-md"
      >
        <div className="flex w-max space-x-2 p-1">{renderContent()}</div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent transition-opacity duration-200",
          showLeftGradient ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent transition-opacity duration-200",
          showRightGradient ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  )
}
