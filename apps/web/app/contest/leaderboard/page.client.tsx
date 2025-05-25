"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import {
  useRoundSubmissions,
  useToggleVote,
  type Round,
  usePreviousRoundsSubmissions,
} from "@/lib/queries"
import { LeaderboardList } from "@/components/features/contest/leaderboard-list"
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
import { ChevronDown } from "lucide-react"

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
    seasonal: [],
    marketing: [],
    ui: [],
  })

  // Control how many items to display
  const [showAll, setShowAll] = useState(false)
  const ITEMS_LIMIT = 10

  // Flag to track if initial randomization is done
  const isRandomizationDoneRef = useRef<boolean>(false)

  // Check if current round is active
  const isCurrentRoundActive = useMemo(() => {
    const now = new Date()
    const startDate = new Date(currentRound.start_at)
    const endDate = new Date(currentRound.end_at)
    return now >= startDate && now <= endDate
  }, [currentRound.start_at, currentRound.end_at])

  const {
    submissions = [],
    getFilteredSubmissions,
    isLoading,
    error,
  } = useRoundSubmissions(currentRound.id)
  const toggleVote = useToggleVote(currentRound.id)

  // Fetch previous rounds data
  const {
    data: previousRoundsData = [],
    isLoading: previousRoundsLoading,
    error: previousRoundsError,
  } = usePreviousRoundsSubmissions(3)

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

    const categories: Category[] = ["global", "seasonal", "marketing", "ui"]
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

  // Get limited or all rows based on the showAll state
  const displayRows = useMemo(() => {
    if (showAll) {
      return filteredRows
    }
    return filteredRows.slice(0, ITEMS_LIMIT)
  }, [filteredRows, showAll])

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
        {/* Only show current round sections if the round is active */}
        {isCurrentRoundActive && (
          <>
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
                        Global Awards (10)
                      </TableCell>
                      <TableCell>
                        🥇 $700 • 🥈 $400 • 🥉 $250 • 4th-10th $50 each
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Seasonal Awards (3)
                      </TableCell>
                      <TableCell>🥇 $150 • 🥈 $100 • 🥉 $50</TableCell>
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
                Overlap allowed: the same component can win in multiple
                categories
              </p>
            </div>

            {/* Notice about pause after Week 3 */}
            {currentRound.week_number === 3 && (
              <div className="space-y-2">
                <div className="rounded-lg border border-border p-4 bg-muted/20">
                  <div className="flex items-center gap-2 font-medium mb-2">
                    <span>⏸️</span>
                    <span>Important Notice</span>
                  </div>
                  <p className="text-sm">
                    After Week 3, we'll be taking a short pause to evaluate the
                    contest format and gather community feedback. Stay tuned for
                    announcements about the next phase of 21st.dev contests!
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-medium">Leaderboard</h2>
                <div className="text-sm">
                  <span className="font-medium">
                    Week #{currentRound.week_number}
                  </span>{" "}
                  -{" "}
                  {formatDateRange(currentRound.start_at, currentRound.end_at)}
                </div>
              </div>
              <div>
                <Tabs
                  value={selectedCategory}
                  onValueChange={(value) =>
                    setSelectedCategory(value as Category)
                  }
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
                submissions={displayRows}
                roundId={currentRound.id}
                toggleVote={toggleVote}
                category={selectedCategory}
                seasonalTheme={
                  selectedCategory === "seasonal"
                    ? seasonalTag?.name
                    : undefined
                }
                isLoading={isLoading}
              />

              {filteredRows.length > ITEMS_LIMIT && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowAll(!showAll)}
                    className="mt-4"
                  >
                    {showAll ? "Show Less" : "Show More"}{" "}
                    <ChevronDown
                      className={`ml-2 h-4 w-4 ${showAll ? "rotate-180" : ""} transition-transform`}
                    />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Previous Weeks Results */}
        {previousRoundsData.length > 0 && (
          <div className="mt-12 space-y-8">
            <h2 className="text-xl font-semibold">Previous Weeks Results</h2>

            {previousRoundsData.map((roundData) => (
              <div key={roundData.round.id} className="space-y-6 border-t pt-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">
                    Week #{roundData.round.week_number} Results
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {formatDateRange(
                      roundData.round.start_at,
                      roundData.round.end_at,
                    )}
                  </div>
                </div>

                {/* Global Winners for all weeks */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Global Winners</h4>
                  <div className="">
                    <LeaderboardList
                      submissions={
                        roundData.isFirstWeek
                          ? roundData.submissions.slice(0, 3) // Only top 3 for the first week
                          : roundData.submissions.slice(0, 10) // Top 10 for other weeks
                      }
                      roundId={roundData.round.id}
                      toggleVote={null}
                      category="global"
                      isLoading={false}
                      isHistorical={true}
                    />
                  </div>
                </div>

                {/* Seasonal Winners */}
                {roundData.seasonalTag && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">
                      {roundData.seasonalTag.name} Winners
                    </h4>
                    <div className="">
                      <LeaderboardList
                        submissions={roundData.submissions
                          .filter((submission: any) => {
                            const tags = submission.tags || []
                            return tags.some(
                              (tag: any) =>
                                (typeof tag === "string" ? tag : tag?.slug) ===
                                roundData.seasonalTag?.slug,
                            )
                          })
                          .slice(0, 3)}
                        roundId={roundData.round.id}
                        toggleVote={null}
                        category="seasonal"
                        seasonalTheme={roundData.seasonalTag.name}
                        isLoading={false}
                        isHistorical={true}
                      />
                    </div>
                  </div>
                )}

                {/* Special case for week 1: Marketing and UI categories */}
                {roundData.isFirstWeek && (
                  <>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Marketing Winners</h4>
                      <div className="">
                        <LeaderboardList
                          submissions={roundData.submissions
                            .filter((submission: any) => {
                              const tags = submission.tags || []
                              return tags.some((tag: any) => {
                                const slug =
                                  typeof tag === "string" ? tag : tag?.slug
                                return [
                                  "hero",
                                  "testimonials",
                                  "pricing-section",
                                  "features",
                                ].includes(slug)
                              })
                            })
                            .slice(0, 3)}
                          roundId={roundData.round.id}
                          toggleVote={null}
                          category="marketing"
                          isLoading={false}
                          isHistorical={true}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">UI Winners</h4>
                      <div className="">
                        <LeaderboardList
                          submissions={roundData.submissions
                            .filter((submission: any) => {
                              const tags = submission.tags || []
                              return tags.some((tag: any) => {
                                const slug =
                                  typeof tag === "string" ? tag : tag?.slug
                                return [
                                  "button",
                                  "card",
                                  "form",
                                  "tabs",
                                  "toggle",
                                ].includes(slug)
                              })
                            })
                            .slice(0, 3)}
                          roundId={roundData.round.id}
                          toggleVote={null}
                          category="ui"
                          isLoading={false}
                          isHistorical={true}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-center mt-4">
                  <Button
                    variant="ghost"
                    asChild
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Link
                      href={`/contest/archive/${roundData.round.week_number}`}
                    >
                      View all Week #{roundData.round.week_number} submissions
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
