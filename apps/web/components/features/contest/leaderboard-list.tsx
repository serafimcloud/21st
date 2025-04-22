"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { ComponentPreviewDialog } from "@/components/features/component-page/preview-dialog"
import { DemoWithComponent } from "@/types/global"

export type Category = "global" | "marketing" | "ui" | "seasonal"

export type LeaderboardRow = DemoWithComponent & {
  global_rank?: number | null
  category_rank?: number | null
  has_voted?: boolean
  votes_count?: number
  name: string
  description: string | null
  final_score: number
  component_id: number
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
  const [selectedDemo, setSelectedDemo] = useState<DemoWithComponent | null>(
    null,
  )
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

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
      <div className="space-y-4">
        {rows.map((row, idx) => (
          <motion.div
            key={`${category}-${row.component_id}-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <Card
              className="group relative bg-background hover:bg-muted/50 transition-all duration-200 px-0 py-2 sm:-mx-2 sm:p-3 shadow-none border-none cursor-pointer"
              onClick={() => {
                if (row.bundle_url?.html) {
                  setSelectedDemo(row)
                  setIsPreviewOpen(true)
                }
              }}
            >
              <div className="flex items-start gap-3">
                {/* Preview Image */}
                <Avatar className="h-10 w-10 rounded-lg flex-shrink-0 bg-muted">
                  {row.preview_url ? (
                    <AvatarImage
                      src={row.preview_url}
                      alt={row.name || ""}
                      className="object-cover rounded-lg"
                    />
                  ) : (
                    <AvatarFallback className="text-base font-semibold bg-primary/5 text-primary rounded-lg">
                      {(row.name || "").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-all duration-300">
                      {(category === "global"
                        ? row.global_rank
                        : row.category_rank) || idx + 1}
                      . {row.name}
                    </h3>
                    {category !== "global" && (
                      <Badge
                        variant="secondary"
                        className="capitalize bg-primary/10 text-primary border-0 text-xs px-2 py-0"
                      >
                        {category}
                      </Badge>
                    )}
                  </div>

                  {row.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {row.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                    <div>
                      <span className="font-medium text-foreground">
                        {row.final_score.toLocaleString()}
                      </span>{" "}
                      points
                    </div>
                    {onVote && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "gap-1.5 h-6 px-2 hover:bg-primary/10",
                          row.has_voted && "text-primary bg-primary/10",
                        )}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onVote(row.component_id)
                        }}
                        disabled={isVoting}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>{row.votes_count || 0}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {selectedDemo && (
        <ComponentPreviewDialog
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false)
            setSelectedDemo(null)
          }}
          demo={selectedDemo}
        />
      )}
    </>
  )
}
