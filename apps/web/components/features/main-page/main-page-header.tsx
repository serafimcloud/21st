import { atom, useAtom } from "jotai"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ArrowUpDown } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

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

const TAB_OPTIONS = {
  sections: "Sections",
  components: "Components",
  authors: "Design Engineers",
  pro: "Pro",
} as const

export function ComponentsHeader({
  activeTab,
  onTabChange,
}: {
  activeTab: "sections" | "components" | "authors" | "pro"
  onTabChange: (tab: "sections" | "components" | "authors" | "pro") => void
}) {
  const [sortBy, setSortBy] = useAtom(sortByAtom)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
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
    onTabChange(value as "sections" | "components" | "authors" | "pro")
  }

  if (!isClient) {
    return (
      <div className="flex flex-col gap-4 mb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="h-auto gap-2 rounded-none bg-transparent px-0 py-1 text-foreground">
                <TabsTrigger
                  value="sections"
                  className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                >
                  Sections
                </TabsTrigger>
                <TabsTrigger
                  value="components"
                  className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                >
                  Components
                </TabsTrigger>
                <TabsTrigger
                  value="authors"
                  className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                >
                  Design Engineers
                </TabsTrigger>
                <TabsTrigger
                  value="pro"
                  className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                >
                  Pro
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
      className={`flex flex-col gap-4 ${activeTab !== "sections" && activeTab !== "components" ? "mb-5" : "mb-3"}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {isDesktop ? (
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="h-auto gap-2 rounded-none bg-transparent px-0 py-1 text-foreground">
                <TabsTrigger
                  value="sections"
                  className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                >
                  Sections
                </TabsTrigger>
                <TabsTrigger
                  value="components"
                  className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                >
                  Components
                </TabsTrigger>
                <TabsTrigger
                  value="authors"
                  className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                >
                  Design Engineers
                </TabsTrigger>
                <TabsTrigger
                  value="pro"
                  className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                >
                  Pro
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            <Select value={activeTab} onValueChange={handleTabChange}>
              <SelectTrigger className="border-0 bg-transparent font-medium text-md shadow-none focus:ring-0">
                <SelectValue placeholder={TAB_OPTIONS[activeTab]} />
              </SelectTrigger>
              <SelectContent className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
                {Object.entries(TAB_OPTIONS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {activeTab === "components" && (
          <div className="flex items-center gap-2 md:w-auto min-w-0">
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
          </div>
        )}
      </div>
    </div>
  )
}
