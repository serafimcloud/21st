"use client"

import { cn } from "@/lib/utils"
import { categories } from "@/lib/navigation"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { Skeleton } from "@/components/ui/skeleton"

interface FilterChipsProps {
  activeTab: "categories" | "components" | "templates"
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
          {allTags.map((tag) => {
            const tagSlug = tag.href.split("/")[2] || ""
            return (
              <Button
                key={tag.href}
                onClick={() => onFilterChange(tagSlug)}
                variant={selectedFilter === tagSlug ? "default" : "outline"}
                className="rounded-full"
                size="sm"
              >
                {tag.title}
              </Button>
            )
          })}
        </>
      )
    }

    if (activeTab === "templates") {
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
