"use client"

import { useState, KeyboardEvent, useEffect } from "react"
import { toast } from "sonner"
import { LoaderCircle } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth, useUser } from "@clerk/nextjs"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { Skeleton } from "@/components/ui/skeleton"
import { PayoutHistoryTable } from "@/components/features/settings/payouts/payout-history-table"
interface PayoutRecord {
  id: string
  period: string
  amount: number
  status: string
  created_at: string
  updated_at: string
}

interface AuthorStats {
  published_components: number
  last_month_usage: number
  last_month_share: number
  estimated_payout: number
  payouts: PayoutRecord[]
  current_month: string
  last_month: string
}

async function fetchUserPaypalEmail(username: string): Promise<string> {
  const response = await fetch(`/api/user/profile?username=${username}`)
  if (!response.ok) {
    throw new Error("Failed to fetch user profile")
  }
  const userData = await response.json()
  return userData.paypal_email || ""
}

async function fetchAuthorStats(): Promise<AuthorStats> {
  const response = await fetch("/api/author/stats")
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to load payout statistics")
  }
  return (await response.json()) as AuthorStats
}

export function PayoutsSettingsClient() {
  const { userId } = useAuth()
  const { user: clerkUser } = useUser()
  const [paypalEmail, setPaypalEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isValidEmail, setIsValidEmail] = useState(true)
  const supabase = useClerkSupabaseClient()

  const { data: userPaypalEmail, isLoading: isLoadingEmail } = useQuery({
    queryKey: ["userPaypalEmail", clerkUser?.username],
    queryFn: async () => {
      return await fetchUserPaypalEmail(clerkUser?.username || "serafimcloud")
    },
    enabled: !!clerkUser,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (userPaypalEmail) {
      setPaypalEmail(userPaypalEmail)
    }
  }, [userPaypalEmail])

  const { data: authorStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["authorStats", userId],
    queryFn: async () => {
      try {
        return await fetchAuthorStats()
      } catch (error) {
        console.error("Error fetching author stats:", error)
        toast.error("Failed to load payout statistics")
        throw error
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value
    setPaypalEmail(email)
    setIsValidEmail(email === "" || validateEmail(email))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && paypalEmail && isValidEmail) {
      e.preventDefault()
      savePaypalEmail()
    }
  }

  const savePaypalEmail = async () => {
    if (!paypalEmail) {
      toast.error("Please enter your PayPal email")
      return
    }

    if (!validateEmail(paypalEmail)) {
      setIsValidEmail(false)
      toast.error("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    try {
      const targetUsername = clerkUser?.username

      const requestBody = {
        paypal_email: paypalEmail,
        target_username: targetUsername,
      }

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save PayPal email")
      }

      toast.success("PayPal email saved successfully")
    } catch (error) {
      console.error("Error saving PayPal email:", error)
      toast.error("Failed to save PayPal email. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Published components
            </div>
            <div className="text-2xl font-semibold">
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                authorStats?.published_components || 0
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Usage (last month)
            </div>
            <div className="text-2xl font-semibold">
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                authorStats?.last_month_usage || 0
              )}
            </div>
            {!isLoadingStats && authorStats?.last_month && (
              <div className="text-xs text-muted-foreground">
                {authorStats.last_month}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Estimated payout
            </div>
            <div className="text-2xl font-semibold">
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                `$${(authorStats?.estimated_payout || 0).toFixed(2)}`
              )}
            </div>
            {!isLoadingStats && authorStats?.current_month && (
              <div className="text-xs text-muted-foreground">
                {authorStats.current_month}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Payment Method</h3>

        <div className="bg-background rounded-lg border border-border overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <p className="text-sm">PayPal Email</p>
              <p className="text-xs text-muted-foreground mt-1">
                We'll send your earnings to this PayPal account
              </p>
            </div>

            <div className="w-full sm:w-1/2 sm:max-w-xs">
              {userPaypalEmail === undefined ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Input
                  type="email"
                  placeholder="your-email@example.com"
                  value={paypalEmail}
                  onChange={handleEmailChange}
                  onKeyDown={handleKeyDown}
                  className={!isValidEmail ? "border-red-500" : ""}
                />
              )}
              {!isValidEmail && (
                <p className="text-xs text-red-500 mt-1">
                  Please enter a valid email address
                </p>
              )}
            </div>
          </div>

          <div className="bg-muted p-3 rounded-b-lg flex justify-end border-t">
            <Button
              disabled={
                isLoading ||
                !isValidEmail ||
                !paypalEmail ||
                userPaypalEmail === undefined
              }
              onClick={savePaypalEmail}
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="mr-2 h-3 w-3 animate-spin" />
                  Saving
                </>
              ) : (
                "Save email"
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Payout History</h3>
        <PayoutHistoryTable
          payouts={authorStats?.payouts}
          isLoading={isLoadingStats}
        />
      </div>
    </div>
  )
}
