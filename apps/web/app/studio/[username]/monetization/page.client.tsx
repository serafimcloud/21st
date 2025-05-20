"use client"

import { useQuery } from "@tanstack/react-query"

import { getStripeDetails } from "@/components/features/stripe/utils"
import { Spinner } from "@/components/icons/spinner"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function MonetizationClient({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    data: stripeAccountData,
    isLoading: isStripeAccountLoading,
    error: stripeAccountError,
  } = useQuery({
    queryKey: ["stripe-account"],
    queryFn: async () => {
      const data = await getStripeDetails()
      return data
    },
  })

  const openStripeOnboarding = async () => {
    const response = await fetch("/api/stripe/get-account-link", {
      method: "GET",
    })

    if (!response.ok) {
      const { error } = await response.json()
      throw new Error(error)
    }

    const { url } = await response.json()
    window.location.href = url
  }

  const handleConnectStripe = async () => {
    setIsLoading(true)
    await openStripeOnboarding().catch((error) => {
      setIsLoading(false)
      toast.error("Failed to connect Stripe")
    })
  }

  const openStripeDashboard = async () => {
    const response = await fetch("/api/stripe/get-dashboard-link", {
      method: "GET",
    })

    if (!response.ok) {
      const { error } = await response.json()
      throw new Error(error)
    }

    const { url } = await response.json()
    window.location.href = url
  }

  const handleOpenStripeDashboard = async () => {
    setIsLoading(true)
    await openStripeDashboard().catch((error) => {
      setIsLoading(false)
      toast.error("Failed to open Stripe dashboard")
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-sm font-medium">Monetization</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Configure your payment settings and view history
          </p>
        </div>
      </div>
      {/* TODO: Craft loading state when fetching links */}
      {isStripeAccountLoading || isLoading ? (
        <Button disabled className="gap-2">
          <Spinner size={16} color="white" />
          Loading...
        </Button>
      ) : stripeAccountData?.isReady ? (
        <Button onClick={handleOpenStripeDashboard}>
          Open Dashboard <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <Button onClick={handleConnectStripe}>
          Connect Stripe <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
