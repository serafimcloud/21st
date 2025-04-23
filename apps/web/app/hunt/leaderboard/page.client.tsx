"use client"

import { useState } from "react"
import { useRoundSubmissions, useToggleVote, type Round } from "@/lib/queries"
import {
  LeaderboardList,
  type Category,
} from "@/components/features/hunt/leaderboard-list"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/ui/header.client"
import { Loader2 } from "lucide-react"

interface Tag {
  id: string
  name: string
}

interface LeaderboardClientProps {
  currentRound: Round
  seasonalTag: Tag | null
}

export function LeaderboardClient({
  currentRound,
  seasonalTag,
}: LeaderboardClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>("global")

  const {
    submissions = [],
    getFilteredSubmissions,
    isLoading,
    error,
  } = useRoundSubmissions(currentRound.id)
  const toggleVote = useToggleVote(currentRound.id)

  // Фильтруем по категории
  const filteredRows = getFilteredSubmissions(selectedCategory)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-destructive">
        Error loading submissions: {error.message}
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="space-y-8">
        {/* Header Section */}
        <div className="space-y-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-semibold">Top Components</h2>
          <div className="text-sm text-muted-foreground">
            {submissions.length} submissions
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-between border-b">
          <Tabs
            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value as Category)}
            className="w-full"
          >
            <TabsList className="w-full justify-start h-10 bg-transparent p-0 space-x-6">
              <TabsTrigger
                value="global"
                className="data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 px-2 !shadow-none"
              >
                Global
              </TabsTrigger>
              <TabsTrigger
                value="marketing"
                className="data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 px-2 !shadow-none"
              >
                Marketing
              </TabsTrigger>
              <TabsTrigger
                value="ui"
                className="data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 px-2 !shadow-none"
              >
                UI
              </TabsTrigger>
              <TabsTrigger
                value="seasonal"
                className="data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 px-2 !shadow-none"
              >
                {seasonalTag?.name}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Components List */}
      <div className="space-y-4">
        <LeaderboardList
          submissions={filteredRows}
          roundId={currentRound.id}
          toggleVote={toggleVote}
        />
      </div>

      {/* Scoring Info */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b">
          <h3 className="font-medium">How Scoring Works</h3>
        </div>
        <div className="bg-background rounded-lg border border-border overflow-hidden">
          <div className="p-4">
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[70px]">Votes:</span>
                <span className="text-muted-foreground">
                  Direct upvotes from the community
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[70px]">Installs:</span>
                <span className="text-muted-foreground">
                  Times component was downloaded or used
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[70px]">Views:</span>
                <span className="text-muted-foreground">
                  Traffic to component detail page
                </span>
              </li>
            </ul>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
