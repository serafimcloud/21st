"use client"

import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  PayoutStats,
  PayoutStatsChart,
} from "@/components/features/settings/payouts/payout-stats-chart"
import { useClerkSupabaseClient } from "@/lib/clerk"

interface AuthorStats {
  published_components: number
  payoutStats: PayoutStats[]
}

async function fetchAuthorStats(): Promise<AuthorStats> {
  const response = await fetch(`/api/author/stats`)
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to load analytics statistics")
  }
  const res = await response.json()
  return {
    published_components: res.published_components,
    payoutStats: res.payoutStats,
  } as AuthorStats
}

export function AnalyticsClient({ userId }: { userId: string }) {
  const supabase = useClerkSupabaseClient()

  const { data: authorStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["authorStats", userId],
    queryFn: async () => {
      try {
        return await fetchAuthorStats()
      } catch (error) {
        console.error("Error fetching author stats:", error)
        toast.error("Failed to load analytics statistics")
        throw error
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="space-y-6">
      <div className="w-full overflow-hidden">
        <PayoutStatsChart
          data={authorStats?.payoutStats ?? []}
          isLoading={isLoadingStats || authorStats?.payoutStats === undefined}
        />
      </div>
    </div>
  )
}
