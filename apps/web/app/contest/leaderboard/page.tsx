"use client"

import { useState, useEffect } from "react"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useUser } from "@clerk/nextjs"

// Import our queries and types
import {
  useContestRounds,
  useRoundSubmissions,
  useToggleVote,
  Round,
  Submission,
} from "@/lib/queries"

// Import our feature components
import {
  LeaderboardList,
  type Category,
} from "@/components/features/contest/leaderboard-list"
import { CategorySwitcher } from "@/components/features/contest/category-switcher"
import { RoundHeader } from "@/components/features/contest/round-header"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

export default function LeaderboardPage() {
  const [selectedRound, setSelectedRound] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category>("global")

  const { user } = useUser()
  const { data: rounds = [], isLoading: isLoadingRounds } = useContestRounds()
  const { data: submissions = [], isLoading: isLoadingSubmissions } =
    useRoundSubmissions(selectedRound)
  const toggleVote = useToggleVote(selectedRound)

  useEffect(() => {
    if (!rounds.length) return

    // ① ищем активный: now между start_at и end_at
    const now = Date.now()
    const active = rounds.find(
      (r) =>
        r.start_at &&
        r.end_at &&
        now >= new Date(r.start_at).getTime() &&
        now <= new Date(r.end_at).getTime(),
    )

    if (active) {
      setSelectedRound(active.id)
    } else {
      // ② иначе берем ближайший прошедший (<= now)
      const past = rounds.find(
        (r) => r.start_at && new Date(r.start_at).getTime() <= now,
      )
      if (past) setSelectedRound(past.id)
    }
  }, [rounds])

  const currentRound = rounds.find((r) => r.id === selectedRound)

  // фильтруем по категории
  const filteredRows = submissions.filter((s) =>
    selectedCategory === "global"
      ? s.category === "global"
      : s.category === selectedCategory,
  )

  // Handle voting
  const handleVote = async (componentId: number) => {
    if (!user) {
      toast.error("Please sign in to vote")
      return
    }

    try {
      await toggleVote.mutateAsync({ componentId })
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  return (
    <div className="container py-8 space-y-8">
      <RoundHeader currentRound={currentRound} isLoading={isLoadingRounds} />

      <div className="space-y-6 lg:grid lg:grid-cols-[minmax(0,720px)_280px] lg:gap-10 lg:space-y-0">
        {/* LEFT */}
        <LeaderboardList
          rows={filteredRows}
          isLoading={isLoadingSubmissions}
          category={selectedCategory}
          onVote={handleVote}
          isVoting={toggleVote.isLoading}
        />
        {/* RIGHT */}
        <CategorySwitcher
          category={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>
    </div>
  )
}
