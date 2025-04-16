"use client"

import {
  useFeaturedDemos,
  useMainDemosExcludingFeatured,
  useLatestDemos,
  useTagDemos,
  getTagDemosCount,
} from "@/lib/queries"
import { HorizontalSlider } from "./horizontal-slider"
import { SortOption } from "@/types/global"
import { DemoWithComponent } from "@/types/global"
import { useMemo } from "react"
import { useNavigation } from "@/hooks/use-navigation"
import { useRouter } from "next/navigation"

interface HomeTabLayoutProps {
  sortBy?: SortOption
}

interface SliderGroup {
  id: string
  title: string
  items: DemoWithComponent[] | undefined
  isLoading: boolean
  targetTab?: "components"
  targetSort?: string
  tagSlug?: string
  totalCount?: number
}

export function HomeTabLayout({ sortBy = "recommended" }: HomeTabLayoutProps) {
  const featuredDemosQuery = useFeaturedDemos()
  const popularDemosQuery = useMainDemosExcludingFeatured()
  const latestDemosQuery = useLatestDemos()

  const tagCategories = useMemo(
    () => [
      { id: "hero", title: "Heros" },
      { id: "features", title: "Features" },
      { id: "ai-chat", title: "AI Chat Components" },
      { id: "call-to-action", title: "Calls to Action" },
      { id: "button", title: "Buttons" },
      { id: "testimonials", title: "Testimonials" },
      { id: "pricing-section", title: "Pricing Sections" },
      { id: "text", title: "Text Components" },
    ],
    [],
  )

  const tagQueries = Object.fromEntries(
    tagCategories.map((category) => [
      category.id,
      useTagDemos(category.id, "recommended", undefined, 20),
    ]),
  )

  const { navigateToTab, handleSortChange } = useNavigation()
  const router = useRouter()

  const filteredPopularDemos = useMemo(() => {
    if (!popularDemosQuery.data) return []

    if (!featuredDemosQuery.data?.ids) return popularDemosQuery.data

    const featuredIds = featuredDemosQuery.data.ids
    return popularDemosQuery.data.filter((demo) => !featuredIds.has(demo.id))
  }, [popularDemosQuery.data, featuredDemosQuery.data?.ids])

  const sliderGroups = useMemo(() => {
    const groups: SliderGroup[] = [
      {
        id: "featured",
        title: "Featured",
        items: featuredDemosQuery.data?.data || [],
        isLoading: featuredDemosQuery.isLoading,
        targetTab: "components",
        targetSort: "recommended",
      },
      {
        id: "popular",
        title: "Popular",
        items: filteredPopularDemos,
        isLoading: popularDemosQuery.isLoading,
        targetTab: "components",
        targetSort: "downloads",
      },
      {
        id: "latest",
        title: "New",
        items: latestDemosQuery.data || [],
        isLoading: latestDemosQuery.isLoading,
        targetTab: "components",
        targetSort: "date",
      },
    ]

    for (const category of tagCategories) {
      const query = tagQueries[category.id]
      if (query) {
        groups.push({
          id: category.id,
          title: category.title,
          items: query.data?.data || [],
          isLoading: query.isLoading,
          tagSlug: category.id,
          totalCount: getTagDemosCount(category.id),
        })
      }
    }

    return groups
  }, [
    featuredDemosQuery.data,
    featuredDemosQuery.isLoading,
    filteredPopularDemos,
    popularDemosQuery.isLoading,
    latestDemosQuery.data,
    latestDemosQuery.isLoading,
    tagCategories,
    tagQueries,
  ])

  const handleViewAll = (group: SliderGroup) => {
    if (group.tagSlug) {
      router.push(`/s/${group.tagSlug}`)
    } else if (group.targetTab && group.targetSort) {
      handleSortChange(group.targetSort)
      navigateToTab(group.targetTab)
    }
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
          totalCount={group.totalCount}
        />
      ))}
    </div>
  )
}
