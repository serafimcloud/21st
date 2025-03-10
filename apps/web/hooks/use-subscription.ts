import { useCallback, useState } from "react"
import { toast } from "sonner"
import { PlanType } from "@/lib/config/subscription-plans"

export interface PlanInfo {
  id?: string
  name: string
  type: PlanType
  period?: string | null
  periodEnd?: string | null
  current_period_end?: string
  cancel_at_period_end?: boolean
  portal_url?: string
  stripe_subscription_id?: string
  // Данные об использовании
  usage: number
  limit: number
  // Дополнительная информация о плане
  planData?: {
    id: number
    stripe_plan_id: string
    price: number
    env: string
    period: string
    type: string
    add_usage: number
  }
}

export function useSubscription() {
  const [isLoading, setIsLoading] = useState(false)

  const fetchSubscription = useCallback(async (): Promise<PlanInfo | null> => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/stripe/get-subscription")
      if (!response.ok) {
        throw new Error("Failed to fetch subscription")
      }
      const data = await response.json()
      return data
    } catch (error) {
      toast.error("Failed to update subscription information")
      console.error("Error fetching subscription:", error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    fetchSubscription,
  }
}
