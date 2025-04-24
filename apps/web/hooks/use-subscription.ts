import { useCallback } from "react"
import { useAtom } from "jotai"
import { userStateAtom } from "@/lib/store/user-store"
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
  usage: number
  limit: number
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
  const [userState] = useAtom(userStateAtom)

  const fetchSubscription = useCallback(async () => {
    return userState.subscription
  }, [userState.subscription])

  return {
    isLoading: userState.isSubscriptionLoading,
    fetchSubscription,
  }
}
