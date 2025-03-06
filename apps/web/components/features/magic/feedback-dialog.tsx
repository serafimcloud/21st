"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useUser } from "@clerk/nextjs"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Check, LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import { Database } from "@/types/supabase"
import { cn } from "@/lib/utils"
import React from "react"

type UserRole =
  | "designer"
  | "frontend_developer"
  | "backend_developer"
  | "product_manager"
  | "entrepreneur"
type FeedbackType = "feedback" | "feature_request"

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialType?: FeedbackType
}

interface CheckboxCardProps extends React.HTMLAttributes<HTMLDivElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: string
  description?: string
  icon?: React.ReactNode
}

const CheckboxCard = React.forwardRef<HTMLDivElement, CheckboxCardProps>(
  (
    {
      className,
      checked = false,
      onCheckedChange,
      label,
      description,
      icon,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex cursor-pointer items-start gap-4 rounded-md border border-border p-4 transition-all duration-200",
          "hover:border-primary/50 hover:bg-muted/50",
          checked && "border-primary bg-primary/5",
          className,
        )}
        onClick={() => onCheckedChange?.(!checked)}
        {...props}
      >
        <div className="flex-shrink-0 pt-0.5">
          <div
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-md border border-border bg-background transition-all duration-200",
              checked && "border-primary bg-primary text-primary-foreground",
              !checked && "group-hover:border-primary/50",
            )}
          >
            {checked && <Check className="h-3.5 w-3.5" />}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {icon}
            <div className="text-sm font-medium text-foreground">{label}</div>
          </div>
          {description && (
            <div className="mt-1 text-xs text-muted-foreground">
              {description}
            </div>
          )}
        </div>
      </div>
    )
  },
)
CheckboxCard.displayName = "CheckboxCard"

export function FeedbackDialog({
  open,
  onOpenChange,
  initialType = "feedback",
}: FeedbackDialogProps) {
  const { user } = useUser()
  const supabase = useClerkSupabaseClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [type, setType] = useState<FeedbackType>(initialType)
  const [content, setContent] = useState("")
  const [role, setRole] = useState<UserRole | "">("")

  // Load user's role using useQuery
  const { data: userData } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })

  // Set initial role when data changes
  useEffect(() => {
    if (userData?.role) {
      setRole(userData.role as UserRole)
    }
  }, [userData?.role])

  // Set initial type and reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setType(initialType)
    } else {
      setContent("")
    }
  }, [open, initialType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !content || !role) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      // Only update role if it has changed from the current user data
      if (role !== userData?.role) {
        const { error: updateError } = await supabase
          .from("users")
          .update({
            role: role as Database["public"]["Enums"]["user_role"],
          } as Database["public"]["Tables"]["users"]["Update"])
          .eq("id", user.id)

        if (updateError) {
          console.error("Error updating user role:", updateError)
          throw new Error(`Failed to update user role: ${updateError.message}`)
        }
      }

      // Submit the feedback
      const { error: feedbackError } = await supabase.from("feedback").insert({
        user_id: user.id,
        type,
        content,
        status: "pending",
      })

      if (feedbackError) {
        console.error("Error submitting feedback:", feedbackError)
        throw new Error(`Failed to submit feedback: ${feedbackError.message}`)
      }

      toast.success("Thank you for your feedback!")
      onOpenChange(false)
      setContent("")
    } catch (error) {
      console.error("Error in feedback submission:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit feedback. Please try again.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[100dvh] flex-col gap-0 p-0 sm:h-[min(740px,90vh)] sm:max-w-[550px] sm:rounded-xl"
        hideCloseButton={false}
      >
        <DialogHeader className="flex-none border-b border-border px-6 py-4">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Send Feedback
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Help us improve Magic MCP by sharing your thoughts or requesting new
            features.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto overscroll-contain webkit-overflow-scrolling-touch">
            <div className="min-h-full space-y-6 px-6 py-4">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>What would you like to share?</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <CheckboxCard
                      checked={type === "feedback"}
                      onCheckedChange={() => setType("feedback")}
                      label="Feedback"
                      className="py-2.5"
                    />
                    <CheckboxCard
                      checked={type === "feature_request"}
                      onCheckedChange={() => setType("feature_request")}
                      label="Feature Request"
                      className="py-2.5"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Your Role</Label>
                  <div className="grid gap-2">
                    {[
                      { value: "designer", label: "Designer" },
                      {
                        value: "frontend_developer",
                        label: "Frontend Developer",
                      },
                      {
                        value: "backend_developer",
                        label: "Backend Developer",
                      },
                      { value: "product_manager", label: "Product Manager" },
                      { value: "entrepreneur", label: "Entrepreneur" },
                    ].map(({ value, label }) => (
                      <CheckboxCard
                        key={value}
                        checked={role === value}
                        onCheckedChange={() => setRole(value as UserRole)}
                        label={label}
                        className="py-2.5"
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">
                    {type === "feedback" ? "Your Feedback" : "Feature Request"}
                  </Label>
                  <Textarea
                    id="content"
                    placeholder={
                      type === "feedback"
                        ? "Tell us what you think about Magic MCP..."
                        : "Describe the feature you'd like to see..."
                    }
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-none border-t border-border px-6 py-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-3 w-3 animate-spin" />
                  Submitting
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
