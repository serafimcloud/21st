import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getContestRounds } from "@/lib/queries"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { ArchivePageClient } from "./page.client"

interface Params {
  week: string
}

async function getWeekData(weekNumber: number) {
  const rounds = await getContestRounds(supabaseWithAdminAccess)

  // Find the specific round
  const round = rounds.find((round) => round.week_number === weekNumber)

  if (!round) {
    return null
  }

  // Get the seasonal tag if it exists
  let seasonalTag = null
  if (round.seasonal_tag_id) {
    const { data } = await supabaseWithAdminAccess
      .from("tags")
      .select("id,name,slug")
      .eq("id", round.seasonal_tag_id)
      .single()

    // Convert numeric id to string for type compatibility
    if (data) {
      seasonalTag = {
        ...data,
        id: String(data.id),
      }
    }
  }

  return {
    round,
    seasonalTag,
  }
}

export default async function WeekArchivePage(props: {
  params: Promise<{ week: string }>
}) {
  const params = await props.params
  const weekNumber = parseInt(params.week, 10)

  if (isNaN(weekNumber) || weekNumber <= 0) {
    return notFound()
  }

  const weekData = await getWeekData(weekNumber)

  if (!weekData) {
    return notFound()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            Loading...
          </div>
        }
      >
        <ArchivePageClient
          round={weekData.round}
          seasonalTag={weekData.seasonalTag}
        />
      </Suspense>
    </div>
  )
}
