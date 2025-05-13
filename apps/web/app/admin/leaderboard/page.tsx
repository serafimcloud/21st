"use client"

import { FC, useState, useMemo, useEffect } from "react"
import { motion } from "motion/react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AdminHeader from "@/components/features/admin/AdminHeader"
import NonAdminPlaceholder from "@/components/features/admin/NonAdminPlaceholder"
import { useIsAdmin } from "@/components/features/publish/hooks/use-is-admin"
import { useClerkSupabaseClient } from "@/lib/clerk"
import {
  useRoundSubmissions,
  useToggleVote,
  useContestRounds,
} from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Define the Category type
type Category = "global" | "seasonal" | "marketing" | "ui"

interface Round {
  id: number
  week_number: number
  start_at: string
  end_at: string
  seasonal_tag_id: number | null
  created_at: string
}

interface Tag {
  id: string
  name: string
  slug?: string
}

const AdminLeaderboardPage: FC = () => {
  const isAdmin = useIsAdmin()
  const [selectedCategory, setSelectedCategory] = useState<Category>("global")
  const [showAll, setShowAll] = useState(false)
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null)
  const ITEMS_LIMIT = 20

  const supabaseWithAdminAccess = useClerkSupabaseClient()

  // Fetch all rounds for dropdown
  const { data: allRounds, isLoading: isRoundsLoading } = useContestRounds()

  // Get current round info (for default selection and seasonal tag)
  const { data: roundData, isLoading: isRoundLoading } = useQuery({
    queryKey: ["admin-current-round"],
    queryFn: async () => {
      const now = new Date().toISOString()
      // First try to get active round
      const { data: activeRound } = await supabaseWithAdminAccess
        .from("component_hunt_rounds")
        .select("*")
        .lte("start_at", now)
        .gte("end_at", now)
        .single()
      let round = activeRound as Round | null
      if (!round) {
        // If no active round, get the most recent past round
        const { data: pastRound } = await supabaseWithAdminAccess
          .from("component_hunt_rounds")
          .select("*")
          .lte("start_at", now)
          .order("start_at", { ascending: false })
          .limit(1)
          .single()
        round = pastRound as Round
      }
      // Get the seasonal tag for this round
      let seasonalTag: Tag | null = null
      if (round?.seasonal_tag_id) {
        const { data: tag } = await supabaseWithAdminAccess
          .from("tags")
          .select("id, name, slug")
          .eq("id", round.seasonal_tag_id)
          .single()
        seasonalTag = tag
          ? {
              id: tag.id.toString(),
              name: tag.name,
              slug: tag.slug,
            }
          : null
      }
      return { round, seasonalTag }
    },
  })

  // Set default selected round to current round when loaded
  useEffect(() => {
    if (roundData?.round && selectedRoundId === null) {
      setSelectedRoundId(roundData.round.id)
    }
  }, [roundData?.round, selectedRoundId])

  // Find the selected round object
  const selectedRound =
    (allRounds?.find((r: Round) => r.id === selectedRoundId) as Round) ||
    roundData?.round ||
    null
  const seasonalTag = roundData?.seasonalTag || null

  // Get submissions for the selected round
  const {
    submissions = [],
    getFilteredSubmissions,
    isLoading: isSubmissionsLoading,
    error,
  } = useRoundSubmissions(selectedRoundId)

  const filteredRows = useMemo(() => {
    return getFilteredSubmissions(selectedCategory)
  }, [selectedCategory, getFilteredSubmissions])

  // Get limited or all rows based on the showAll state
  const displayRows = useMemo(() => {
    if (showAll) {
      return filteredRows
    }
    return filteredRows.slice(0, ITEMS_LIMIT)
  }, [filteredRows, showAll, ITEMS_LIMIT])

  // Non-admin placeholder
  if (!isAdmin) {
    return <NonAdminPlaceholder />
  }

  return (
    <div className="container py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AdminHeader
          title="Leaderboard Admin"
          subtitle="View complete leaderboard data including rankings, votes, and metrics"
        />

        {isRoundLoading || isRoundsLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  Week #{selectedRound?.week_number} Leaderboard
                </h2>
                <p className="text-sm text-muted-foreground">
                  Showing complete data regardless of visibility policy
                </p>
              </div>
              {/* Round selection dropdown */}
              <div>
                <label
                  htmlFor="round-select"
                  className="block text-sm font-medium mb-1"
                >
                  Select round:
                </label>
                <select
                  id="round-select"
                  className="border rounded px-3 py-2 bg-background"
                  value={selectedRoundId ?? ""}
                  onChange={(e) => setSelectedRoundId(Number(e.target.value))}
                >
                  {allRounds?.map((round: Round) => (
                    <option key={round.id} value={round.id}>
                      {`Week #${round.week_number} (${new Date(round.start_at).toLocaleDateString()} - ${new Date(round.end_at).toLocaleDateString()})`}
                    </option>
                  ))}
                </select>
              </div>
              <Button asChild>
                <Link href="/contest/leaderboard">View Public Leaderboard</Link>
              </Button>
            </div>

            {/* Scoring Formula Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Scoring Formula</CardTitle>
                <CardDescription>
                  Current formula used to calculate final scores. This formula
                  emphasizes community votes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg border bg-muted/20">
                  <code className="text-lg">
                    final_score = (votes × 1.0) + (installs × 0.1) + (views ×
                    0.0)
                  </code>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>1 vote = 10 installs in terms of score impact</li>
                    <li>Views don't affect the score</li>
                    <li>
                      This formula is applied to all leaderboard calculations
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="mb-4">
              <Tabs
                value={selectedCategory}
                onValueChange={(value) =>
                  setSelectedCategory(value as Category)
                }
                className="w-full"
              >
                <TabsList className="w-full justify-start h-10 bg-muted/50 rounded-lg border border-border p-0">
                  <TabsTrigger
                    value="global"
                    className="data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-10 px-4 !shadow-none"
                  >
                    Global
                  </TabsTrigger>
                  {seasonalTag && (
                    <TabsTrigger
                      value="seasonal"
                      className="data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-10 px-4 !shadow-none"
                    >
                      {seasonalTag.name}
                    </TabsTrigger>
                  )}
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
                </TabsList>
              </Tabs>
            </div>

            {isSubmissionsLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="text-center py-10 text-destructive">
                Error loading submissions: {error.message}
              </div>
            ) : displayRows.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No submissions found for this category
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">Rank</TableHead>
                      <TableHead className="w-24">Component ID</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Votes</TableHead>
                      <TableHead>Installs</TableHead>
                      <TableHead>Bookmarks</TableHead>
                      <TableHead>Final Score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayRows.map((submission, index) => {
                      const userData = submission.user_data || {}
                      const componentData = submission.component_data || {}

                      return (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            {submission.component_id ||
                              submission.component?.id ||
                              ""}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded overflow-hidden">
                                <img
                                  src={
                                    submission.preview_url || "/placeholder.svg"
                                  }
                                  alt={componentData.name || submission.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {componentData.name || submission.name}
                                </div>
                                {submission.name !== "Default" &&
                                  componentData.name !== submission.name && (
                                    <div className="text-xs text-muted-foreground">
                                      {submission.name}
                                    </div>
                                  )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full overflow-hidden">
                                <img
                                  src={
                                    userData.display_image_url ||
                                    "/placeholder.svg"
                                  }
                                  alt={userData.username || "User"}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span>{userData.username || "Anonymous"}</span>
                            </div>
                          </TableCell>
                          <TableCell>{submission.view_count || 0}</TableCell>
                          <TableCell>{submission.votes || 0}</TableCell>
                          <TableCell>{submission.installs || 0}</TableCell>
                          <TableCell>
                            {submission.bookmarks_count || 0}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold">
                              {submission.final_score
                                ? submission.final_score.toFixed(2)
                                : "—"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link
                                href={`/${userData.username}/${submission.component?.component_slug || componentData.component_slug}/${submission.demo_slug || "default"}`}
                                target="_blank"
                              >
                                View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {filteredRows.length > ITEMS_LIMIT && (
              <div className="flex justify-center my-6">
                <Button variant="outline" onClick={() => setShowAll(!showAll)}>
                  {showAll ? "Show Less" : "Show All"}
                  <ChevronDown
                    className={`ml-2 h-4 w-4 ${
                      showAll ? "rotate-180" : ""
                    } transition-transform`}
                  />
                </Button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}

export default AdminLeaderboardPage
