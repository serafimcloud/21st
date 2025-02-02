"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { sections } from "@/lib/navigation"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

interface FilterChipsProps {
  activeTab: "sections" | "components"
  selectedFilter: string
  onFilterChange: (filter: string) => void
}

export function FilterChips({
  activeTab,
  selectedFilter,
  onFilterChange,
}: FilterChipsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (selectedFilter) {
      params.set("filter", selectedFilter)
    } else {
      params.delete("filter")
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }, [selectedFilter, router, searchParams])

  if (activeTab === "sections") {
    return (
      <div className="relative mb-3">
        <ScrollArea className="w-full whitespace-nowrap rounded-md">
          <div className="flex w-max space-x-2 p-1">
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
              UI Elements
            </Button>
            <Button
              onClick={() => onFilterChange("landing")}
              variant={selectedFilter === "landing" ? "default" : "outline"}
              className="rounded-full"
              size="sm"
            >
              Landing Pages
            </Button>
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
      </div>
    )
  }

  if (activeTab === "components") {
    const allTags = sections.reduce(
      (acc, section) => {
        section.items.forEach((item) => {
          if (!acc.some((tag) => tag.href === item.href)) {
            acc.push(item)
          }
        })
        return acc
      },
      [] as { title: string; href: string }[],
    )

    return (
      <div className="relative mb-3">
        <ScrollArea className="w-full whitespace-nowrap rounded-md">
          <div className="flex w-max space-x-2 p-1">
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
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
      </div>
    )
  }

  return null
}
