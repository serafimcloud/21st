"use client"

import {
  useFeaturedDemos,
  useMainDemosExcludingFeatured,
  useLatestDemos,
  useTagDemos,
  getTagDemosCount,
  useLeaderboardDemosForHome,
} from "@/lib/queries"
import { HorizontalSlider } from "./horizontal-slider"
import { SortOption } from "@/types/global"
import { DemoWithComponent } from "@/types/global"
import { useMemo, useEffect, useState } from "react"
import { useNavigation } from "@/hooks/use-navigation"
import { useRouter } from "next/navigation"
import { shouldHideLeaderboardRankings } from "@/lib/utils"

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
  viewAllUrl?: string
  isLeaderboard?: boolean
}

// Helper to check if we need to randomize leaderboard
const shouldRandomizeLeaderboard = () => {
  const now = new Date()
  const day = now.getDay() // 0 is Sunday, 1 is Monday, etc.
  const hour = now.getHours()

  // Randomize if it's Monday (1), Tuesday (2), or Wednesday (3) before midnight
  return day >= 1 && day <= 3 && !(day === 3 && hour >= 0 && hour < 24)
}

export function HomeTabLayout({ sortBy = "recommended" }: HomeTabLayoutProps) {
  const featuredDemosQuery = useFeaturedDemos()
  const popularDemosQuery = useMainDemosExcludingFeatured()
  const latestDemosQuery = useLatestDemos()
  const leaderboardDemosQuery = useLeaderboardDemosForHome()

  // State to store the already randomized leaderboard items
  const [randomizedLeaderboardItems, setRandomizedLeaderboardItems] = useState<
    DemoWithComponent[]
  >([])

  // Process leaderboard data once when it arrives
  useEffect(() => {
    if (
      !leaderboardDemosQuery.data ||
      !Array.isArray(leaderboardDemosQuery.data)
    ) {
      setRandomizedLeaderboardItems([])
      return
    }

    if (shouldRandomizeLeaderboard()) {
      // Create a new array to avoid mutating the original
      const shuffled = [...leaderboardDemosQuery.data]

      // Fisher-Yates shuffle algorithm
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = shuffled[i]
        shuffled[i] = shuffled[j] as DemoWithComponent
        shuffled[j] = temp as DemoWithComponent
      }

      setRandomizedLeaderboardItems(shuffled)
    } else {
      setRandomizedLeaderboardItems(leaderboardDemosQuery.data)
    }
  }, [leaderboardDemosQuery.data])

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
        id: "leaderboard",
        title: "Weekly Leaderboard",
        items: randomizedLeaderboardItems,
        isLoading: leaderboardDemosQuery.isLoading,
        viewAllUrl: "/contest/leaderboard",
        isLeaderboard: true,
      },
      {
        id: "popular",
        title: "Popular",
        items: filteredPopularDemos,
        isLoading: popularDemosQuery.isLoading,
        targetTab: "components",
        targetSort: "downloads",
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
    randomizedLeaderboardItems,
    leaderboardDemosQuery.isLoading,
  ])

  const handleViewAll = (group: SliderGroup) => {
    if (group.viewAllUrl) {
      router.push(group.viewAllUrl)
    } else if (group.tagSlug) {
      router.push(`/s/${group.tagSlug}`)
    } else if (group.targetTab && group.targetSort) {
      handleSortChange(group.targetSort)
      navigateToTab(group.targetTab)
    }
  }

  // Check if we need to hide rankings and votes
  const shouldHideRankings = shouldHideLeaderboardRankings()

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
          viewAllUrl={group.viewAllUrl}
          isLeaderboard={group.isLeaderboard}
        />
      ))}
    </div>
  )
}
