"use client"

import { useState, useEffect, KeyboardEvent } from "react"
import { toast } from "sonner"
import { LoaderCircle, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth, useUser } from "@clerk/nextjs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useClerkSupabaseClient } from "@/lib/clerk"

interface PayoutRecord {
  id: string
  period: string
  usage: number
  amount: number
  status: string
}

export function PayoutsSettingsClient() {
  const { userId } = useAuth()
  const { user: clerkUser } = useUser()
  const [paypalEmail, setPaypalEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isValidEmail, setIsValidEmail] = useState(true)
  const supabase = useClerkSupabaseClient()

  const publishedComponents = 0
  const usageLastMonth = 0
  const estimatedPayout = 0

  const payoutHistory: PayoutRecord[] = []

  useEffect(() => {
    const fetchUserPaypalEmail = async () => {
      try {
        const targetUsername = "serafimcloud"
        console.log("Fetching user data for username:", targetUsername)

        const response = await fetch(
          `/api/user/profile?username=${targetUsername}`,
        )
        const userData = await response.json()
        console.log("Received user data:", userData)

        if (response.ok && userData.paypal_email) {
          console.log("Setting paypal email:", userData.paypal_email)
          setPaypalEmail(userData.paypal_email)
        }
      } catch (error) {
        console.error("Failed to fetch user PayPal email:", error)
      }
    }

    fetchUserPaypalEmail()
  }, [clerkUser])

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
      console.log("Saving PayPal email:", paypalEmail)

      const targetUsername = "serafimcloud"
      console.log("Target username for update:", targetUsername)

      const requestBody = {
        paypal_email: paypalEmail,
        target_username: targetUsername,
      }
      console.log("Request body:", requestBody)

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()
      console.log("API response:", result)

      if (!response.ok) {
        throw new Error(result.error || "Failed to save PayPal email")
      }

      toast.success("PayPal email saved successfully")

      const verifyResponse = await fetch(
        `/api/user/profile?username=${targetUsername}`,
      )
      const verifyData = await verifyResponse.json()
      console.log("Verification data after save:", verifyData)
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
            <div className="text-2xl font-semibold">{publishedComponents}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Usage (last 30 days)
            </div>
            <div className="text-2xl font-semibold">{usageLastMonth}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Estimated payout
            </div>
            <div className="text-2xl font-semibold">
              ${estimatedPayout.toFixed(2)}
            </div>
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
              <Input
                type="email"
                placeholder="your-email@example.com"
                value={paypalEmail}
                onChange={handleEmailChange}
                onKeyDown={handleKeyDown}
                className={!isValidEmail ? "border-red-500" : ""}
              />
              {!isValidEmail && (
                <p className="text-xs text-red-500 mt-1">
                  Please enter a valid email address
                </p>
              )}
            </div>
          </div>

          <div className="bg-muted p-3 rounded-b-lg flex justify-end border-t">
            <Button
              disabled={isLoading || !isValidEmail || !paypalEmail}
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

        <div className="w-full overflow-auto">
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="h-9 py-2">Period</TableHead>
                  <TableHead className="h-9 py-2">Usage</TableHead>
                  <TableHead className="h-9 py-2">Amount</TableHead>
                  <TableHead className="h-9 py-2">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutHistory.length > 0 ? (
                  payoutHistory.map((payout, index) => (
                    <TableRow key={index}>
                      <TableCell className="py-2">{payout.period}</TableCell>
                      <TableCell className="py-2">{payout.usage}</TableCell>
                      <TableCell className="py-2">
                        ${payout.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-2">{payout.status}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Info className="h-8 w-8 mb-2" />
                        <p>No payout history yet</p>
                        <p className="text-xs max-w-md text-center mt-1">
                          Payouts are processed at the end of each billing
                          period for component creators
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
