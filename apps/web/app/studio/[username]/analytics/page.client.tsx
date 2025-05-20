"use client"

import { userStateAtom } from "@/lib/store/user-store"
import { useQuery } from "@tanstack/react-query"
import { atom, useAtom } from "jotai"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { toast } from "sonner"

import {
  PayoutStats,
  PayoutStatsChart,
} from "@/components/features/studio/analytics/creator-stats-chart"
import { useClerkSupabaseClient } from "@/lib/clerk"

// Create an atom for the partner modal state
export const partnerModalOpenAtom = atom(false)

interface AuthorStats {
  published_components: number
  payoutStats: PayoutStats[]
}

async function fetchAuthorStats(userId?: string): Promise<AuthorStats> {
  const url = new URL("/api/author/stats", window.location.origin)
  if (userId) {
    url.searchParams.set("user_id", userId)
  }
  const response = await fetch(url)
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
  const [partnerModalOpen, setPartnerModalOpen] = useAtom(partnerModalOpenAtom)
  const monetizationRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const [userState] = useAtom(userStateAtom)
  const isPartner = userState?.profile?.is_partner || false

  // Check for the monetization hash and handle it
  useEffect(() => {
    // Function to handle hash changes
    const handleHash = () => {
      if (
        typeof window !== "undefined" &&
        window.location.hash === "#monetization"
      ) {
        if (monetizationRef.current) {
          monetizationRef.current.scrollIntoView({ behavior: "smooth" })
        }
        // Open the modal when accessing #monetization
        setPartnerModalOpen(true)
      }
    }

    // Check hash on initial load
    handleHash()

    // Add listener for hash changes
    window.addEventListener("hashchange", handleHash)

    // Clean up
    return () => {
      window.removeEventListener("hashchange", handleHash)
    }
  }, [setPartnerModalOpen])

  const { data: authorStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["authorStats", userId],
    queryFn: async () => {
      try {
        return await fetchAuthorStats(userId)
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
          isPartner={isPartner}
        />
      </div>
    </div>
  )
}
