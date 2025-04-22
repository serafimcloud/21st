"use client"

import React, { useState } from "react"
import { motion } from "motion/react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, ThumbsUp, ExternalLink, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ComponentPreviewDialog } from "@/components/features/component-page/preview-dialog"
import { DemoWithComponent } from "@/types/global"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export type Category = "global" | "marketing" | "ui" | "seasonal"

interface LeaderboardListProps {
  submissions: any[] // Используем any, так как данные теперь приходят напрямую из SQL
  roundId: number
}

export function LeaderboardList({
  submissions = [],
  roundId,
}: LeaderboardListProps) {
  const supabase = useClerkSupabaseClient()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const [isVoting, setIsVoting] = useState(false)
  const [selectedDemo, setSelectedDemo] = useState<any | null>(null)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)

  // Функция для проверки и исправления данных перед открытием диалога
  const prepareDemo = (demo: any) => {
    if (!demo) return null

    // Убедимся, что у demo есть все необходимые поля
    const result = { ...demo }

    // Проверим и исправим bundle_url
    if (!result.bundle_url || typeof result.bundle_url !== "object") {
      result.bundle_url = { html: "about:blank" }
    }

    // Убедимся, что компонент существует и имеет необходимые свойства
    if (!result.component || typeof result.component !== "object") {
      const componentData =
        typeof result.component_data === "object"
          ? result.component_data || {}
          : {}

      result.component = {
        id: componentData.id || 0,
        name: componentData.name || result.name || "",
        component_slug: componentData.component_slug || "",
        user_id: "",
        is_paid: false,
        is_public: true,
        user: {
          id: "",
          username: result.user_data?.username || "",
          display_username: result.user_data?.username || "",
          display_image_url: result.user_data?.display_image_url || null,
          display_name: result.user_data?.username || "",
        },
      }
    }

    // Убедимся, что user существует
    if (!result.user || typeof result.user !== "object") {
      result.user = {
        id: "",
        username: result.user_data?.username || "",
        display_username: result.user_data?.username || "",
        display_image_url: result.user_data?.display_image_url || null,
        display_name: result.user_data?.username || "",
      }
    }

    return result
  }

  const handleVote = async (e: React.MouseEvent, demoId: number) => {
    e.stopPropagation() // Prevent opening preview when clicking vote button
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to vote",
        variant: "destructive",
      })
      return
    }

    try {
      setIsVoting(true)
      const { error } = await supabase.rpc("hunt_toggle_demo_vote", {
        p_demo_id: demoId,
        p_round_id: roundId,
      })

      if (error) throw error

      toast({
        title: "Vote updated",
        description: "Your vote has been recorded",
      })
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Error",
        description: "Failed to update vote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVoting(false)
    }
  }

  if (!Array.isArray(submissions)) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        No submissions found
      </div>
    )
  }

  const handleDemoClick = (submission: any) => {
    console.log("Clicked on demo:", submission) // Отладочный вывод

    // Check if bundle_url exists
    if (!submission.bundle_url || typeof submission.bundle_url !== "object") {
      // If no bundle_url, navigate to the component page directly
      if (
        submission.user_data?.username &&
        submission.component_data?.component_slug &&
        submission.demo_slug
      ) {
        router.push(
          `/${submission.user_data.username}/${submission.component_data.component_slug}/${submission.demo_slug}`,
        )
        return
      }
    }

    // Otherwise show preview dialog
    const prepared = prepareDemo(submission)
    setSelectedDemo(prepared)
    setIsPreviewDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsPreviewDialogOpen(false)
    // Задержка для анимации закрытия диалога перед сбросом данных
    setTimeout(() => {
      setSelectedDemo(null)
    }, 300)
  }

  return (
    <>
      <div className="space-y-2">
        {submissions.map((submission, index) => {
          const userData = submission.user_data || {}
          const componentData = submission.component_data || {}
          const tags = submission.tags || []

          return (
            <motion.div
              key={submission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => handleDemoClick(submission)}
            >
              <div className="group relative flex flex-row items-start gap-4 rounded-xl px-0 py-4 transition-all duration-300 sm:-mx-4 sm:p-4 cursor-pointer hover:sm:bg-gray-100 dark:hover:sm:bg-gray-800">
                {/* Left - Avatar */}
                <Avatar className="h-12 w-12 rounded-xl">
                  <AvatarImage
                    src={userData.display_image_url || ""}
                    className="rounded-xl"
                  />
                  <AvatarFallback className="rounded-xl">
                    {userData.username?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>

                {/* Middle - Content */}
                <div className="flex flex-1 flex-col">
                  {/* Title and External Link */}
                  <div className="flex items-center">
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary">
                      {index + 1}. {submission.name}
                    </h3>
                    <ExternalLink className="relative hidden h-3.5 w-3.5 cursor-pointer px-1 text-muted-foreground transition-all hover:text-primary group-hover:inline-block ml-1" />
                  </div>

                  {/* Description */}
                  <p className="text-base text-muted-foreground">
                    {componentData.name || "No description"}
                  </p>

                  {/* Tags */}
                  <div className="mt-1 flex flex-row flex-wrap items-center gap-2">
                    {Array.isArray(tags) &&
                      tags.map((tag, index) => (
                        <Badge
                          key={
                            typeof tag === "string" ? tag : tag.slug || index
                          }
                          variant="outline"
                          className="text-xs font-normal hover:bg-secondary"
                        >
                          {typeof tag === "string"
                            ? tag
                            : tag.slug || "unknown"}
                        </Badge>
                      ))}
                  </div>
                </div>

                {/* Right - Stats */}
                <div className="flex flex-row gap-2">
                  {/* Votes */}
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "size-12 rounded-xl border-2",
                      submission.has_voted
                        ? "border-primary bg-primary/10"
                        : "hover:border-primary",
                    )}
                    onClick={(e) => handleVote(e, submission.id)}
                    disabled={isVoting}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {isVoting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ThumbsUp className="h-3.5 w-3.5" />
                      )}
                      <div className="text-sm font-semibold leading-none">
                        {submission.votes || 0}
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Используем key для того, чтобы React пересоздал компонент при изменении selectedDemo */}
      {selectedDemo && isPreviewDialogOpen && (
        <ComponentPreviewDialog
          key={`preview-${selectedDemo.id}`}
          isOpen={true}
          onClose={handleCloseDialog}
          demo={selectedDemo}
          hasPurchased={false}
        />
      )}
    </>
  )
}
