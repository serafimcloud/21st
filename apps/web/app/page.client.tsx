"use client"

import React, { useEffect, useState } from "react"
import { useAtom } from "jotai"
import { useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "motion/react"
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
import { LogosList } from "@/components/features/logos/logos-list"

const MainContent = React.memo(function MainContent({
  activeTab,
  selectedFilter,
  setSelectedFilter,
  sortBy,
  sidebarOpen,
  prevSidebarState,
  handleTabChange,
}: {
  activeTab:
    | "categories"
    | "components"
    | "authors"
    | "pro"
    | "templates"
    | "logos"
  selectedFilter: string
  setSelectedFilter: (filter: string) => void
  sortBy: SortOption
  sidebarOpen: boolean
  prevSidebarState: boolean
  handleTabChange: (
    tab:
      | "categories"
      | "components"
      | "authors"
      | "pro"
      | "templates"
      | "logos",
  ) => void
}) {
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
      case "logos":
        return (
          <>
            <FilterChips
              activeTab={activeTab}
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
            />
            <LogosList
              category={selectedFilter === "all" ? undefined : selectedFilter}
              onCategoryChange={setSelectedFilter}
            />
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col">
      <ComponentsHeader activeTab={activeTab} onTabChange={handleTabChange} />
      {renderContent()}
    </div>
  )
})

export function HomePageClient() {
  const [sortBy, setSortBy] = useAtom(sortByAtom)
  const [sidebarOpen] = useAtom(sidebarOpenAtom)
  const [isBannerVisible] = useAtom(magicBannerVisibleAtom)
  const [shouldShowBanner, setShouldShowBanner] = useState(false)
  const [prevSidebarState, setPrevSidebarState] = useState(sidebarOpen)
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<
    "categories" | "components" | "authors" | "pro" | "templates" | "logos"
  >(
    (searchParams.get("tab") as
      | "categories"
      | "components"
      | "authors"
      | "pro"
      | "templates"
      | "logos") || "components",
  )
  const [selectedFilter, setSelectedFilter] = useState<string>("all")

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldShowBanner(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

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
    newTab:
      | "categories"
      | "components"
      | "authors"
      | "pro"
      | "templates"
      | "logos",
  ) => {
    setActiveTab(newTab)
    setSelectedFilter("all")
  }

  return (
    <>
      <AnimatePresence mode="popLayout">
        <AnimatePresence>
          {shouldShowBanner && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{
                duration: 0.2,
                height: {
                  duration: 0.2,
                },
              }}
            >
              <MagicBanner />
            </motion.div>
          )}
        </AnimatePresence>
        <div
          className={cn(
            "container mx-auto px-[var(--container-x-padding)] max-w-[3680px] [--container-x-padding:20px] min-720:[--container-x-padding:24px] min-1280:[--container-x-padding:32px] min-1536:[--container-x-padding:80px] transition-[margin] duration-200 ease-in-out",
            shouldShowBanner && isBannerVisible ? "mt-[144px]" : "mt-20",
          )}
        >
          <MainContent
            activeTab={activeTab}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            sortBy={sortBy}
            sidebarOpen={sidebarOpen}
            prevSidebarState={prevSidebarState}
            handleTabChange={handleTabChange}
          />
        </div>
      </AnimatePresence>
    </>
  )
}
