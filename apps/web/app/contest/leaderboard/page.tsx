import { Metadata } from "next"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { LeaderboardClient } from "./page.client"
import { Footer } from "@/components/ui/footer"
import { Logo } from "@/components/ui/logo"

export const metadata: Metadata = {
  title: "Weekly Component Contest Leaderboard - 21st.dev",
  description:
    "Vote for your favorite components and see who's leading the weekly component contest.",
}

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
}

async function getCurrentRoundWithTag(): Promise<{
  round: Round | null
  seasonalTag: Tag | null
}> {
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

  // If we have a round with a seasonal tag, fetch the tag name
  let seasonalTag: Tag | null = null
  if (round?.seasonal_tag_id) {
    const { data: tag } = await supabaseWithAdminAccess
      .from("tags")
      .select("id, name")
      .eq("id", round.seasonal_tag_id)
      .single()

    seasonalTag = tag
      ? {
          id: tag.id.toString(), // Convert number to string to match Tag interface
          name: tag.name,
        }
      : null
  }

  return { round, seasonalTag }
}

export default async function LeaderboardPage() {
  const { round: currentRound, seasonalTag } = await getCurrentRoundWithTag()

  return (
    <div className="min-h-screen">
      <div className="min-h-screen flex flex-col">
        <Logo className="z-50" />
        <div className="flex-1 mt-[11vh] max-w-[640px] mx-auto w-full px-4">
          <div className="w-full bg-background antialiased mt-14">
            <div className="p-3 sm:p-6 mb-[20vh]">
              <div className="space-y-6">
                {/* Dynamic Content - Client Rendered */}
                {currentRound ? (
                  <LeaderboardClient
                    currentRound={currentRound}
                    seasonalTag={seasonalTag}
                  />
                ) : (
                  <div className="flex items-center justify-center p-8 text-muted-foreground">
                    No active rounds found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  )
}
