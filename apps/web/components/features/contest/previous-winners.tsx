"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"
import { type Category } from "./leaderboard-list"

export type WinnerInfo = {
  component_id: number
  name: string
  preview_url: string | null
  description: string | null
  category: Category | null
  is_global: boolean | null
  prize_tier: number
  round_id: number
}

interface PreviousWinnersProps {
  winners: WinnerInfo[] | undefined
  isLoading: boolean
}

export function PreviousWinners({ winners, isLoading }: PreviousWinnersProps) {
  if (isLoading || !winners || winners.length === 0) {
    return null
  }

  // Get medal emoji based on tier
  const getMedalEmoji = (tier: number): string => {
    switch (tier) {
      case 1:
        return "🥇"
      case 2:
        return "🥈"
      case 3:
        return "🥉"
      default:
        return ""
    }
  }

  // Filter for global winners
  const globalWinners = winners
    .filter((w) => w.is_global)
    .sort((a, b) => a.prize_tier - b.prize_tier)
    .slice(0, 3)

  if (globalWinners.length === 0) {
    return null
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Previous Week Winners</h2>
        <Link
          href="/contest/winners"
          className="text-primary flex items-center hover:underline text-sm"
        >
          View All Previous Winners <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      {/* Global Winners */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Global Winners</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {globalWinners.map((winner) => (
            <Link
              href={`/c/${winner.component_id}`}
              key={`winner-${winner.component_id}`}
              className="block"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-4 h-full flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">
                      {getMedalEmoji(winner.prize_tier)}
                    </span>
                    <span className="font-semibold truncate">
                      {winner.name}
                    </span>
                  </div>

                  <div className="relative aspect-video w-full mb-3 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                    {winner.preview_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={winner.preview_url}
                        alt={winner.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        No Preview
                      </span>
                    )}
                  </div>

                  {winner.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {winner.description}
                    </p>
                  )}
                </Card>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
