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
import { useMemo, useEffect, useState, useRef } from "react"
import { useNavigation } from "@/hooks/use-navigation"
import { useRouter } from "next/navigation"
import { shouldHideLeaderboardRankings } from "@/lib/utils"
import { toast } from "sonner"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useUser } from "@clerk/nextjs"
import { useQueryClient } from "@tanstack/react-query"

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

// Extended type to include leaderboard fields
type LeaderboardDemoWithComponent = DemoWithComponent & {
  global_rank?: number
  votes_count?: number
  has_voted?: boolean
}

// Helper to check if we need to randomize leaderboard
const shouldRandomizeLeaderboard = () => {
  const now = new Date()
  const day = now.getDay() // 0 is Sunday, 1 is Monday, etc.

  // Randomize on weekdays (Monday through Friday)
  // Same logic as shouldHideLeaderboardRankings but reversed
  return !(day === 0 || day === 6)
}

export function HomeTabLayout({ sortBy = "recommended" }: HomeTabLayoutProps) {
  const featuredDemosQuery = useFeaturedDemos()
  const popularDemosQuery = useMainDemosExcludingFeatured()
  const latestDemosQuery = useLatestDemos()
  const leaderboardDemosQuery = useLeaderboardDemosForHome()
  const router = useRouter()
  const supabase = useClerkSupabaseClient()
  const { user } = useUser()
  const queryClient = useQueryClient()

  // Keep track of component order by ID
  const leaderboardItemOrderRef = useRef<number[]>([])

  // State to store the already randomized leaderboard items
  const [randomizedLeaderboardItems, setRandomizedLeaderboardItems] = useState<
    LeaderboardDemoWithComponent[]
  >([])

  // Add state to track if initial randomization is done
  const [isRandomizationDone, setIsRandomizationDone] = useState(false)

  // Process leaderboard data once when it arrives
  useEffect(() => {
    if (
      !leaderboardDemosQuery.data ||
      !Array.isArray(leaderboardDemosQuery.data)
    ) {
      setRandomizedLeaderboardItems([])
      return
    }

    // If we already have an order and randomization is done, maintain the order
    if (isRandomizationDone && leaderboardItemOrderRef.current.length > 0) {
      // Create a map for quick lookups
      const itemsMap = new Map(
        leaderboardDemosQuery.data.map((item) => [item.id, item]),
      )

      // Maintain the same order as before, but with updated data
      const orderedItems = leaderboardItemOrderRef.current
        .map((id) => itemsMap.get(id))
        .filter(Boolean) as LeaderboardDemoWithComponent[]

      // Add any new items that might not be in our order yet
      const existingIds = new Set(leaderboardItemOrderRef.current)
      const newItems = leaderboardDemosQuery.data.filter(
        (item) => !existingIds.has(item.id),
      ) as LeaderboardDemoWithComponent[]

      setRandomizedLeaderboardItems([...orderedItems, ...newItems])
      return
    }

    // Initial randomization
    if (shouldRandomizeLeaderboard()) {
      // Create a new array to avoid mutating the original
      const shuffled = [
        ...leaderboardDemosQuery.data,
      ] as LeaderboardDemoWithComponent[]

      // Fisher-Yates shuffle algorithm
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = shuffled[i]
        shuffled[i] = shuffled[j] as LeaderboardDemoWithComponent
        shuffled[j] = temp as LeaderboardDemoWithComponent
      }

      // Store the order of IDs for future reference
      leaderboardItemOrderRef.current = shuffled.map((item) => item.id)

      setRandomizedLeaderboardItems(shuffled)
    } else {
      // If not randomizing, still store the original order
      leaderboardItemOrderRef.current = leaderboardDemosQuery.data.map(
        (item) => item.id,
      )

      setRandomizedLeaderboardItems(
        leaderboardDemosQuery.data as LeaderboardDemoWithComponent[],
      )
    }

    // Mark randomization as done after initial load
    setIsRandomizationDone(true)
  }, [leaderboardDemosQuery.data, isRandomizationDone])

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
        id: "newest",
        title: "Newest",
        items: latestDemosQuery.data || [],
        isLoading: latestDemosQuery.isLoading,
        targetTab: "components",
        targetSort: "date",
      },
      // Only add leaderboard if there are items
      // ...(randomizedLeaderboardItems && randomizedLeaderboardItems.length > 0
      //   ? [
      //       {
      //         id: "leaderboard",
      //         title: "Weekly Leaderboard",
      //         items: randomizedLeaderboardItems,
      //         isLoading: leaderboardDemosQuery.isLoading,
      //         viewAllUrl: "/contest/leaderboard",
      //         isLeaderboard: true,
      //       },
      //     ]
      //   : []),
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

  // Handle voting for leaderboard items
  const handleVote = async (demoId: number) => {
    if (!user) {
      toast.error("You must be logged in to vote")
      return
    }

    if (!leaderboardDemosQuery.roundId) {
      toast.error("Could not determine current contest round")
      return
    }

    // Find the demo being voted on
    const demoIndex = randomizedLeaderboardItems.findIndex(
      (demo) => demo.id === demoId,
    )
    if (demoIndex === -1) return

    // Get the current vote state
    const currentItem = randomizedLeaderboardItems[demoIndex]
    if (!currentItem) return

    const currentVoteState = currentItem.has_voted || false

    // Apply optimistic update
    const updatedItems = [...randomizedLeaderboardItems]
    const updatedItem = {
      ...updatedItems[demoIndex],
    } as LeaderboardDemoWithComponent

    updatedItem.has_voted = !currentVoteState
    updatedItem.votes_count =
      (updatedItem.votes_count || 0) + (currentVoteState ? -1 : 1)
    updatedItems[demoIndex] = updatedItem

    setRandomizedLeaderboardItems(updatedItems)

    try {
      // Call the backend API
      const { data, error } = await supabase.rpc("hunt_toggle_demo_vote", {
        p_round_id: leaderboardDemosQuery.roundId,
        p_demo_id: demoId,
      })

      if (error) throw error

      toast.success(currentVoteState ? "Vote removed" : "Upvoted")

      // Custom update approach instead of invalidating query
      // This prevents full re-randomization
      queryClient.setQueryData(
        ["leaderboard-demos-home", leaderboardDemosQuery.roundId],
        (oldData: any) => {
          if (!oldData || !Array.isArray(oldData)) return oldData

          return oldData.map((item) => {
            if (item.id === demoId) {
              return {
                ...item,
                has_voted: !currentVoteState,
                votes_count:
                  (item.votes_count || 0) + (currentVoteState ? -1 : 1),
              }
            }
            return item
          })
        },
      )
    } catch (error) {
      console.error("Error toggling vote:", error)
      toast.error("Failed to update vote")

      // Revert the optimistic update on error
      setRandomizedLeaderboardItems([
        ...((leaderboardDemosQuery.data ||
          []) as LeaderboardDemoWithComponent[]),
      ])
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
          onVote={group.isLeaderboard ? handleVote : undefined}
        />
      ))}
    </div>
  )
}
