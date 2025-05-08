"use client"

import { useQuery } from "@tanstack/react-query"
import { LoaderCircle } from "lucide-react"
import { KeyboardEvent, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  PayoutHistoryTable,
  PayoutRecord,
} from "@/components/features/studio/monetization/payout-history-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useUser } from "@clerk/nextjs"

interface AuthorStats {
  published_components: number
  payouts: PayoutRecord[]
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
  const response = await fetch(`/api/author/stats`)
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to load payout statistics")
  }
  const res = await response.json()
  return {
    published_components: res.published_components,
    payouts: res.payouts,
  } as AuthorStats
}

export function MonetizationClient({ userId }: { userId: string }) {
  const { user: clerkUser } = useUser()
  const [paypalEmail, setPaypalEmail] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidEmail, setIsValidEmail] = useState(true)
  const supabase = useClerkSupabaseClient()

  const { data: userPaypalEmail, isLoading: isLoadingEmail } = useQuery({
    queryKey: ["userPaypalEmail", clerkUser?.username],
    queryFn: async () => {
      return await fetchUserPaypalEmail(clerkUser!.username!)
    },
    enabled: !!clerkUser?.username,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (userPaypalEmail !== undefined) {
      setPaypalEmail(userPaypalEmail)
    }
  }, [userPaypalEmail])

  const { data: authorStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["authorStats"],
    queryFn: async () => {
      try {
        return await fetchAuthorStats()
      } catch (error) {
        console.error("Error fetching author stats:", error)
        toast.error("Failed to load payout statistics")
        throw error
      }
    },
    enabled: true,
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
      const requestBody = {
        paypal_email: paypalEmail,
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
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-sm font-medium">Payment Method</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Configure your payment settings and view history
          </p>
        </div>
      </div>

      <div className="space-y-6">
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

        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Payout History</h2>
          <PayoutHistoryTable
            payouts={authorStats?.payouts ?? []}
            isLoading={isLoadingStats || authorStats?.payouts === undefined}
          />
        </div>
      </div>
    </div>
  )
}
