import { atom, useAtom } from "jotai"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ArrowUpDown } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { sidebarOpenAtom } from "@/components/features/main-page/main-layout"

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
  pro: "Pro",
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
                  Pro
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
    <div
      className={`flex flex-col gap-4 ${
        (activeTab !== "categories" &&
          activeTab !== "components" &&
          activeTab !== "templates") ||
        (activeTab === "components" && sidebarOpen)
          ? "mb-5"
          : "mb-3"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {isDesktop ? (
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
                  Pro
                </TabsTrigger>
                <TabsTrigger
                  value="collections"
                  className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-foreground data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                >
                  Collections
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
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
          )}
        </div>

        <div className="flex items-center gap-2 md:w-auto min-w-0">
          {activeTab === "components" && (
            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value as SortOption)
                setCookie({
                  name: "saved_sort_by",
                  value: value,
                  expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                  httpOnly: true,
                  sameSite: "lax",
                })
              }}
            >
              <SelectTrigger
                className={`h-8 ${isDesktop ? "w-[180px]" : "w-auto min-w-[40px] px-2"}`}
              >
                {isDesktop ? (
                  <SelectValue placeholder="Sort by" />
                ) : (
                  <ArrowUpDown className="h-4 w-4" />
                )}
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
        </div>
      </div>
    </div>
  )
}
