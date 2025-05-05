"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useRoundSubmissions, useToggleVote, type Round } from "@/lib/queries"
import {
  LeaderboardList,
  type Category,
} from "@/components/features/contest/leaderboard-list"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/ui/header.client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { shouldHideLeaderboardRankings } from "@/lib/utils"

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
  // Store randomized submissions for each category
  const [randomizedSubmissionsMap, setRandomizedSubmissionsMap] = useState<
    Record<Category, any[]>
  >({
    global: [],
    marketing: [],
    ui: [],
    seasonal: [],
  })

  // Flag to track if initial randomization is done
  const isRandomizationDoneRef = useRef<boolean>(false)

  const {
    submissions = [],
    getFilteredSubmissions,
    isLoading,
    error,
  } = useRoundSubmissions(currentRound.id)
  const toggleVote = useToggleVote(currentRound.id)

  // Use the shared utility function
  const shouldRandomize = shouldHideLeaderboardRankings()

  // Pre-randomize all category submissions ONCE when data arrives
  useEffect(() => {
    if (
      isLoading ||
      !submissions.length ||
      !shouldRandomize ||
      isRandomizationDoneRef.current
    ) {
      // Skip if already randomized, not needed, or no data yet
      return
    }

    const categories: Category[] = ["global", "marketing", "ui", "seasonal"]
    const randomized: Record<Category, any[]> = {} as Record<Category, any[]>

    // For each category, get and randomize the submissions
    categories.forEach((category) => {
      const categorySubmissions =
        category === "global"
          ? [...submissions]
          : [...getFilteredSubmissions(category)]

      // Shuffle using Fisher-Yates
      for (let i = categorySubmissions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[categorySubmissions[i], categorySubmissions[j]] = [
          categorySubmissions[j],
          categorySubmissions[i],
        ]
      }

      randomized[category] = categorySubmissions
    })

    setRandomizedSubmissionsMap(randomized)
    // Mark randomization as done so it doesn't re-randomize on every render
    isRandomizationDoneRef.current = true
  }, [submissions, getFilteredSubmissions, isLoading, shouldRandomize])

  // Get the appropriate submissions for the current category
  const filteredRows = useMemo(() => {
    if (
      shouldRandomize &&
      randomizedSubmissionsMap[selectedCategory]?.length > 0
    ) {
      return randomizedSubmissionsMap[selectedCategory]
    }

    return getFilteredSubmissions(selectedCategory)
  }, [
    selectedCategory,
    shouldRandomize,
    randomizedSubmissionsMap,
    getFilteredSubmissions,
  ])

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-destructive">
        Error loading submissions: {error.message}
      </div>
    )
  }

  return (
    <div className="h-full">
      <Header />
      <div className="space-y-8">
        {/* Prize Information Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium flex items-center gap-2">
              Weekly Prizes
            </h3>
            <Button size="sm">
              <Link href="/publish">Publish your component</Link>
            </Button>
          </div>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Tier</TableHead>
                  <TableHead>Prize</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    Global Awards (3)
                  </TableCell>
                  <TableCell>🥇 $600 • 🥈 $350 • 🥉 $200</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    Category Awards (9)
                  </TableCell>
                  <TableCell>🥇 $150 • 🥈 $100 • 🥉 $50 per category</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    Total Weekly Payout
                  </TableCell>
                  <TableCell className="font-bold">$2,000</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Overlap allowed: the same component can win in multiple categories
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-medium">Leaderboard</h2>
            <div className="text-sm">
              <span className="font-medium">
                Week #{currentRound.week_number}
              </span>{" "}
              - {formatDateRange(currentRound.start_at, currentRound.end_at)}
            </div>
          </div>
          <div>
            <Tabs
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as Category)}
              className="w-full"
            >
              <TabsList className="w-full justify-start h-10 bg-muted/50 rounded-t-lg border border-border p-0">
                <TabsTrigger
                  value="global"
                  className="data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-10 px-4 !shadow-none"
                >
                  Global
                </TabsTrigger>
                <TabsTrigger
                  value="marketing"
                  className="data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-10 px-4 !shadow-none"
                >
                  Marketing
                </TabsTrigger>
                <TabsTrigger
                  value="ui"
                  className="data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-10 px-4 !shadow-none"
                >
                  UI
                </TabsTrigger>
                <TabsTrigger
                  value="seasonal"
                  className="data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-10 px-4 !shadow-none"
                >
                  {seasonalTag?.name}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="space-y-4">
          <LeaderboardList
            submissions={filteredRows}
            roundId={currentRound.id}
            toggleVote={toggleVote}
            category={selectedCategory}
            seasonalTheme={
              selectedCategory === "seasonal" ? seasonalTag?.name : undefined
            }
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
