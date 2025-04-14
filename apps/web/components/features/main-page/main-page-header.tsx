import { atom, useAtom } from "jotai"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ArrowUpDown } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { sidebarOpenAtom } from "@/components/features/main-page/main-layout"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { SortOption } from "@/types/global"
import { SORT_OPTIONS } from "@/types/global"
import { setCookie } from "@/lib/cookies"

export const sortByAtom = atom<SortOption>("recommended")

const tabLabels = {
  components: "Components",
  templates: "Templates",
  categories: "Categories",
  authors: "Design Engineers",
  pro: "Premium Stores",
  collections: "Collections",
} as const

interface ComponentsHeaderProps {
  activeTab:
    | "categories"
    | "components"
    | "authors"
    | "pro"
    | "templates"
    | "collections"
  onTabChange: (
    tab:
      | "categories"
      | "components"
      | "authors"
      | "pro"
      | "templates"
      | "collections",
  ) => void
}

export function ComponentsHeader({
  activeTab,
  onTabChange,
}: ComponentsHeaderProps) {
  const [sortBy, setSortBy] = useAtom(sortByAtom)
  const [sidebarOpen] = useAtom(sidebarOpenAtom)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isClient, setIsClient] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showLeftGradient, setShowLeftGradient] = useState(false)
  const [showRightGradient, setShowRightGradient] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || "")
      ) {
        event.preventDefault()
        inputRef.current?.focus()
      } else if (event.key === "Escape") {
        inputRef.current?.blur()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

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

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    if (value === "components" && sortBy) {
      params.set("sort", sortBy)
    } else {
      params.delete("sort")
    }
    router.push(`?${params.toString()}`, { scroll: false })
    onTabChange(
      value as
        | "categories"
        | "components"
        | "authors"
        | "pro"
        | "templates"
        | "collections",
    )
  }

  const handleSortChange = (value: string) => {
    setSortBy(value as SortOption)
    setCookie({
      name: "saved_sort_by",
      value: value,
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "lax",
    })
  }

  if (!isClient) {
    return (
      <div className="flex flex-col gap-4 mb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="h-auto gap-2 rounded-none bg-transparent px-0 py-1 text-foreground">
                <TabsTrigger
                  value="components"
                  className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-foreground data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                >
                  Components
                </TabsTrigger>
                <TabsTrigger
                  value="templates"
                  className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-foreground data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                >
                  Templates
                </TabsTrigger>
                <TabsTrigger
                  value="categories"
                  className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-foreground data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                >
                  Categories
                </TabsTrigger>
                <TabsTrigger
                  value="authors"
                  className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-foreground data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                >
                  Design Engineers
                </TabsTrigger>
                <TabsTrigger
                  value="pro"
                  className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-foreground data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                >
                  Premium Stores
                </TabsTrigger>
                <TabsTrigger
                  value="collections"
                  className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-foreground data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                >
                  Collections
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 mb-3">
      <div className="flex items-center justify-between gap-4">
        {!isDesktop && (
          <div className="flex items-center gap-4">
            <Select value={activeTab} onValueChange={handleTabChange}>
              <SelectTrigger className="border-0 bg-transparent font-medium text-md shadow-none focus:ring-0">
                <SelectValue placeholder={tabLabels[activeTab]} />
              </SelectTrigger>
              <SelectContent className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
                {Object.entries(tabLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-2 md:w-full min-w-0">
          {activeTab === "components" && (
            <>
              {isDesktop ? (
                <div className="relative w-full">
                  <ScrollArea
                    ref={scrollAreaRef}
                    className="w-full whitespace-nowrap rounded-md"
                  >
                    <div className="flex w-max space-x-2 p-1">
                      {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                        <Button
                          key={value}
                          onClick={() => handleSortChange(value)}
                          variant={sortBy === value ? "default" : "outline"}
                          className="rounded-full"
                          size="sm"
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" className="invisible" />
                  </ScrollArea>
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent transition-opacity duration-200",
                      showLeftGradient ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent transition-opacity duration-200",
                      showRightGradient ? "opacity-100" : "opacity-0",
                    )}
                  />
                </div>
              ) : (
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="h-8 w-auto min-w-[40px] px-2">
                    <ArrowUpDown className="h-4 w-4" />
                  </SelectTrigger>
                  <SelectContent className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
                    {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
