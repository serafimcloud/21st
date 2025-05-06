"use client"

import { useState, useMemo } from "react"
import { useRoundSubmissions, type Round } from "@/lib/queries"
import { LeaderboardList } from "@/components/features/contest/leaderboard-list"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/ui/header.client"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

// Define the Category type locally
type Category = "global" | "seasonal" | "marketing" | "ui"

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const startMonth = startDate.toLocaleString("en-US", { month: "long" })
  const endMonth = endDate.toLocaleString("en-US", { month: "long" })
  const startDay = startDate.getDate()
  const endDay = endDate.getDate()
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}`
  } else {
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}`
  }
}

interface Tag {
  id: string
  name: string
  slug: string
}

interface ArchivePageClientProps {
  round: Round
  seasonalTag: Tag | null
}

export function ArchivePageClient({
  round,
  seasonalTag,
}: ArchivePageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>("global")

  const {
    submissions = [],
    getFilteredSubmissions,
    isLoading,
    error,
  } = useRoundSubmissions(round.id)

  // Determine if this is the first week (special case with marketing and UI categories)
  const isFirstWeek = round.week_number === 1

  // Get the appropriate submissions for the current category
  const filteredRows = useMemo(() => {
    return getFilteredSubmissions(selectedCategory)
  }, [selectedCategory, getFilteredSubmissions])

  // Get available categories for this round
  const availableCategories = useMemo(() => {
    const categories: { value: Category; label: string }[] = [
      { value: "global", label: "Global" },
    ]

    if (seasonalTag) {
      categories.push({
        value: "seasonal",
        label: seasonalTag.name,
      })
    }

    if (isFirstWeek) {
      categories.push(
        { value: "marketing", label: "Marketing" },
        { value: "ui", label: "UI" },
      )
    }

    return categories
  }, [seasonalTag, isFirstWeek])

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-destructive">
        Error loading submissions: {error.message}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 mt-[11vh] max-w-[640px] mx-auto w-full px-4">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/contest/leaderboard">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-xl font-semibold">
                Week #{round.week_number} Archive
              </h1>
            </div>
            <div className="text-sm">
              {formatDateRange(round.start_at, round.end_at)}
            </div>
          </div>

          <div className="space-y-4">
            <Tabs
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as Category)}
              className="w-full"
            >
              <TabsList className="w-full justify-start h-10 bg-muted/50 rounded-t-lg border border-border p-0">
                {availableCategories.map((category) => (
                  <TabsTrigger
                    key={category.value}
                    value={category.value}
                    className="data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-10 px-4 !shadow-none"
                  >
                    {category.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-4">
            <LeaderboardList
              submissions={filteredRows}
              roundId={round.id}
              toggleVote={null}
              category={selectedCategory}
              seasonalTheme={
                selectedCategory === "seasonal" ? seasonalTag?.name : undefined
              }
              isLoading={isLoading}
              isHistorical={true}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
