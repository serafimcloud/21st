"use client"

import React, { useEffect, useState } from "react"
import { useAtom } from "jotai"
import { useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

import { SortOption, SORT_OPTIONS } from "@/types/global"
import { sortByAtom } from "@/components/features/main-page/main-page-header"
import { sidebarOpenAtom } from "@/components/features/main-page/main-layout"
import { ComponentsList } from "@/components/ui/items-list"
import { CategoriesList } from "@/components/features/categories/category-list"
import { ComponentsHeader } from "@/components/features/main-page/main-page-header"
import { FilterChips } from "@/components/features/main-page/filter-chips"
import { DesignEngineersList } from "@/components/features/design-engineers/design-engineers-list"
import { ProList } from "@/components/features/pro/pro-list"
import { TemplatesContainer } from "@/components/features/templates/templates-list"
import {
  MagicBanner,
  magicBannerVisibleAtom,
} from "@/components/features/magic/magic-banner"

export function HomePageClient() {
  const [sortBy, setSortBy] = useAtom(sortByAtom)
  const [sidebarOpen] = useAtom(sidebarOpenAtom)
  const [isBannerVisible] = useAtom(magicBannerVisibleAtom)
  const [prevSidebarState, setPrevSidebarState] = useState(sidebarOpen)
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<
    "categories" | "components" | "authors" | "pro" | "templates"
  >(
    (searchParams.get("tab") as
      | "categories"
      | "components"
      | "authors"
      | "pro"
      | "templates") || "components",
  )
  const [selectedFilter, setSelectedFilter] = useState<string>("all")

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", activeTab)
    if (activeTab === "components" && sortBy) {
      params.set("sort", sortBy)
    } else {
      params.delete("sort")
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }, [activeTab, sortBy, router, searchParams])

  useEffect(() => {
    const sortFromUrl = searchParams.get("sort") as SortOption
    if (sortFromUrl && Object.keys(SORT_OPTIONS).includes(sortFromUrl)) {
      setSortBy(sortFromUrl)
    }
  }, [])

  useEffect(() => {
    if (sortBy !== undefined) {
      queryClient.invalidateQueries({
        queryKey: ["filtered-demos", sortBy],
      })
    }
  }, [sortBy, queryClient])

  useEffect(() => {
    setPrevSidebarState(sidebarOpen)
  }, [sidebarOpen])

  const handleTabChange = (
    newTab: "categories" | "components" | "authors" | "pro" | "templates",
  ) => {
    setActiveTab(newTab)
    setSelectedFilter("all")
  }

  const renderContent = () => {
    switch (activeTab) {
      case "categories":
        return (
          <>
            <FilterChips
              activeTab={activeTab}
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
            />
            <CategoriesList filter={selectedFilter} />
          </>
        )
      case "components":
        return (
          <>
            <AnimatePresence mode="popLayout">
              {!sidebarOpen && (
                <motion.div
                  initial={
                    prevSidebarState !== sidebarOpen
                      ? { opacity: 0, height: 0, marginBottom: 0 }
                      : false
                  }
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{
                    duration: 0.2,
                    height: {
                      duration: 0.2,
                    },
                  }}
                >
                  <FilterChips
                    activeTab={activeTab}
                    selectedFilter={selectedFilter}
                    onFilterChange={setSelectedFilter}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              layout={prevSidebarState !== sidebarOpen}
              initial={
                prevSidebarState !== sidebarOpen ? { opacity: 0, y: 20 } : false
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{
                layout: { duration: 0.2 },
              }}
            >
              <ComponentsList
                type="main"
                sortBy={sortBy}
                tagSlug={selectedFilter === "all" ? undefined : selectedFilter}
              />
            </motion.div>
          </>
        )
      case "authors":
        return <DesignEngineersList />
      case "pro":
        return <ProList />
      case "templates":
        return (
          <>
            <FilterChips
              activeTab={activeTab}
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
            />
            <TemplatesContainer tagSlug={selectedFilter} />
          </>
        )
      default:
        return null
    }
  }

  return (
    <>
      <MagicBanner />
      <div
        className={cn(
          "container mx-auto px-[var(--container-x-padding)] max-w-[3680px] [--container-x-padding:20px] min-720:[--container-x-padding:24px] min-1280:[--container-x-padding:32px] min-1536:[--container-x-padding:80px] transition-[margin] duration-200 ease-in-out",
          isBannerVisible ? "mt-[144px]" : "mt-20",
        )}
      >
        <div className="flex flex-col">
          <ComponentsHeader
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          {renderContent()}
        </div>
      </div>
    </>
  )
}
