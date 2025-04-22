"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Loader2, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type Category = "global" | "marketing" | "ui" | "seasonal"

export type LeaderboardRow = {
  component_id: number
  name: string
  preview_url: string | null
  description: string | null
  final_score: number
  global_rank?: number | null
  category_rank?: number | null
  has_voted?: boolean
  votes_count?: number
}

interface LeaderboardListProps {
  rows: LeaderboardRow[] | undefined
  isLoading: boolean
  category: Category
  onVote?: (componentId: number) => void
  isVoting?: boolean
}

export function LeaderboardList({
  rows,
  isLoading,
  category,
  onVote,
  isVoting,
}: LeaderboardListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>No components found for this category</p>
      </div>
    )
  }

  return (
    <>
      {rows.map((row, idx) => (
        <motion.div
          key={`${category}-${row.component_id}-${idx}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
        >
          <Card className="p-4 flex gap-4 hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 w-10 text-center font-semibold">
              {idx < 3 ? (
                <Trophy
                  className={`h-5 w-5 mx-auto ${
                    idx === 0
                      ? "text-yellow-500"
                      : idx === 1
                        ? "text-gray-400"
                        : "text-amber-700"
                  }`}
                />
              ) : (
                <span className="text-lg">
                  {category === "global" ? row.global_rank : row.category_rank}
                </span>
              )}
            </div>

            <Link href={`/c/${row.component_id}`} className="flex flex-1 gap-4">
              <Avatar className="h-16 w-16 rounded-md border flex-shrink-0">
                {row.preview_url ? (
                  <AvatarImage src={row.preview_url} alt={row.name} />
                ) : (
                  <AvatarFallback className="text-sm bg-muted">
                    {row.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="flex flex-col gap-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="font-medium leading-tight truncate max-w-[260px]">
                    {row.name}
                  </span>
                  {category !== "global" && (
                    <Badge variant="secondary" className="capitalize">
                      {category}
                    </Badge>
                  )}
                </div>

                {row.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {row.description}
                  </p>
                )}

                <div className="mt-1 text-sm">
                  <span className="font-semibold">
                    {row.final_score.toLocaleString()}
                  </span>{" "}
                  points
                </div>
              </div>
            </Link>

            {onVote && (
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("gap-2", row.has_voted && "text-primary")}
                  onClick={(e) => {
                    e.preventDefault()
                    onVote(row.component_id)
                  }}
                  disabled={isVoting}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{row.votes_count || 0}</span>
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </>
  )
}
