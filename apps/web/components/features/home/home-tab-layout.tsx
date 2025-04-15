"use client"

import {
  useFeaturedDemos,
  useMainDemosExcludingFeatured,
  useLatestDemos,
} from "@/lib/queries"
import { HorizontalSlider } from "./horizontal-slider"
import { SortOption } from "@/types/global"
import { DemoWithComponent } from "@/types/global"
import { useMemo } from "react"
import { useNavigation } from "@/hooks/use-navigation"

interface HomeTabLayoutProps {
  sortBy?: SortOption
}

interface SliderGroup {
  id: string
  title: string
  items: DemoWithComponent[] | undefined
  isLoading: boolean
  targetTab: "components"
  targetSort: string
}

export function HomeTabLayout({ sortBy = "recommended" }: HomeTabLayoutProps) {
  const featuredDemosQuery = useFeaturedDemos()
  const popularDemosQuery = useMainDemosExcludingFeatured()
  const latestDemosQuery = useLatestDemos()

  // Используем наш новый хук вместо прямого доступа к атомам
  const { navigateToTab, handleSortChange } = useNavigation()

  // Filter popular demos to remove any duplicates from featured demos
  const filteredPopularDemos = useMemo(() => {
    if (!popularDemosQuery.data) return []

    // If featured demos aren't loaded yet, just return the popular demos
    if (!featuredDemosQuery.data?.ids) return popularDemosQuery.data

    // Filter out items that appear in the featured list
    const featuredIds = featuredDemosQuery.data.ids
    return popularDemosQuery.data.filter((demo) => !featuredIds.has(demo.id))
  }, [popularDemosQuery.data, featuredDemosQuery.data?.ids])

  // Define slider groups configuration
  const sliderGroups: SliderGroup[] = [
    {
      id: "featured",
      title: "Featured Components",
      items: featuredDemosQuery.data?.data || [],
      isLoading: featuredDemosQuery.isLoading,
      targetTab: "components",
      targetSort: "recommended",
    },
    {
      id: "popular",
      title: "Popular Components",
      items: filteredPopularDemos,
      isLoading: popularDemosQuery.isLoading || featuredDemosQuery.isLoading,
      targetTab: "components",
      targetSort: "downloads",
    },
    {
      id: "latest",
      title: "Latest Additions",
      items: latestDemosQuery.data || [],
      isLoading: latestDemosQuery.isLoading,
      targetTab: "components",
      targetSort: "date",
    },
  ]

  // Handle navigation to "View all" for a specific group
  const handleViewAll = (group: SliderGroup) => {
    // Обновляем сортировку и переходим к компонентам - все это теперь делается через хук
    handleSortChange(group.targetSort)
    navigateToTab("components")
  }

  return (
    <div className="space-y-8">
      {sliderGroups.map((group) => (
        <HorizontalSlider
          key={group.id}
          title={group.title}
          items={group.items || []}
          isLoading={group.isLoading}
          onViewAll={() => handleViewAll(group)}
        />
      ))}
    </div>
  )
}

// Hook to get latest demos function removed as it's now in queries.ts
