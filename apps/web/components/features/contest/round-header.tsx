"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export type RoundInfo = {
  id: number
  week_number: number
  start_at: string
  end_at: string
  seasonal_tag_id: number | null
}

interface RoundHeaderProps {
  currentRound: RoundInfo | undefined
  isLoading: boolean
}

export function RoundHeader({ currentRound, isLoading }: RoundHeaderProps) {
  // Format date range for display
  const formatDateRange = () => {
    if (!currentRound) return ""

    const startDate = new Date(currentRound.start_at)
    const endDate = new Date(currentRound.end_at)

    const formatOptions: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    }

    return `${startDate.toLocaleDateString("en-US", formatOptions)} – ${endDate.toLocaleDateString("en-US", formatOptions)}`
  }

  return (
    <div className="mb-8 space-y-2">
      <Link
        href="/contest"
        className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Contest Info
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Weekly Component Hunt
          </h1>
          {currentRound && (
            <p className="text-muted-foreground">
              Week #{currentRound.week_number} · {formatDateRange()}
            </p>
          )}
        </div>

        <Button asChild variant="outline">
          <Link href="/publish">Submit Your Component</Link>
        </Button>
      </div>
    </div>
  )
}
