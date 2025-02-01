"use client"

import { useEffect } from "react"
import { atom, useAtom } from "jotai"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

export function ComponentsHeader({
  filtersDisabled,
  activeTab,
  onTabChange,
}: {
  filtersDisabled: boolean
  activeTab: "sections" | "components"
  onTabChange: (tab: "sections" | "components") => void
}) {
  const [sortBy, setSortBy] = useAtom(sortByAtom)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Tabs
            value={activeTab}
            onValueChange={(v) => onTabChange(v as "sections" | "components")}
          >
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
            </TabsList>
          </Tabs>
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
              <SelectContent>
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
