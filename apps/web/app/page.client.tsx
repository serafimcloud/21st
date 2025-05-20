"use client"

import React, { useEffect, useState } from "react"
import { useAtom } from "jotai"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"

import { SortOption } from "@/types/global"
import { sidebarOpenAtom } from "@/components/features/main-page/main-layout"
import { magicBannerVisibleAtom } from "@/components/features/magic/magic-banner"
import { ComponentsList } from "@/components/ui/items-list"
import { CategoriesList } from "@/components/features/categories/category-list"
import { ComponentsHeader } from "@/components/features/main-page/main-page-header"
import { FilterChips } from "@/components/features/main-page/filter-chips"
import { DesignEngineersList } from "@/components/features/design-engineers/design-engineers-list"
import { ProList } from "@/components/features/pro/pro-list"
import { TemplatesContainer } from "@/components/features/templates/templates-list"
import { MagicBanner } from "@/components/features/magic/magic-banner"
import { CollectionsContainer } from "@/components/features/collections/collections-list"
import { HomeTabLayout } from "@/components/features/home/home-layout"
import { useNavigation } from "@/hooks/use-navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import type { AppSection } from "@/lib/atoms"
import { BoltBanner } from "@/components/features/bolt/bolt-banner"

const MainContent = React.memo(function MainContent({
  activeTab,
  prevSidebarState,
  sidebarOpen,
  sortBy,
  handleTabChange,
}: {
  activeTab: Exclude<AppSection, "magic"> | "home"
  prevSidebarState: boolean
  sidebarOpen: boolean
  sortBy: SortOption
  handleTabChange: (tab: Exclude<AppSection, "magic"> | "home") => void
}) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all")
  const isMobile = useIsMobile()

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeTabLayout sortBy={sortBy} />
      case "categories":
        return <CategoriesList />
      case "components":
        return (
          <>
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
      case "collections":
        return (
          <>
            <CollectionsContainer tagSlug={selectedFilter} />
          </>
        )
      default:
        return null
    }
  }

  if (activeTab === "home" && isMobile) {
    return (
      <div className="flex flex-col pb-4 pt-20">
        <ComponentsHeader activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="mb-10">
          <BoltBanner />
        </div>
        {renderContent()}
      </div>
    )
  }

  if (activeTab === "home") {
    return (
      <div className="flex flex-col pb-4 pt-[70px]">
        {isMobile ? (
          <ComponentsHeader
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        ) : (
          <BoltBanner />
        )}

        <div className="mt-[25px]">{renderContent()}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-4 pt-20">
      <ComponentsHeader activeTab={activeTab} onTabChange={handleTabChange} />
      <BoltBanner />
      {renderContent()}
    </div>
  )
})

export function HomePageClient() {
  const [sidebarOpen] = useAtom(sidebarOpenAtom)
  const [magicBannerVisible] = useAtom(magicBannerVisibleAtom)
  const [shouldShowBanner, setShouldShowBanner] = useState(false)
  const [prevSidebarState, setPrevSidebarState] = useState(sidebarOpen)
  const isMobile = useIsMobile()

  const { activeTab, sortBy, navigateToTab } = useNavigation()

  useEffect(() => {
    setPrevSidebarState(sidebarOpen)
  }, [sidebarOpen])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldShowBanner(!isMobile)
    }, 3000)
    return () => clearTimeout(timer)
  }, [isMobile])

  const handleTabChange = (tab: Exclude<AppSection, "magic"> | "home") => {
    navigateToTab(tab)
  }

  return (
    <main
      className={cn(
        "flex flex-1 flex-col",
        magicBannerVisible && shouldShowBanner && "mt-3 md:mt-4",
      )}
    >
      <div className="container">
        <AnimatePresence>
          {magicBannerVisible && shouldShowBanner && <MagicBanner />}
        </AnimatePresence>
        <MainContent
          activeTab={activeTab}
          prevSidebarState={prevSidebarState}
          sidebarOpen={sidebarOpen}
          sortBy={sortBy}
          handleTabChange={handleTabChange}
        />
      </div>
    </main>
  )
}
