import { atom } from "jotai"
import { PlanInfo } from "@/hooks/use-subscription"
import type { User } from "@/types/global"

interface UserState {
  subscription: PlanInfo | null
  isSubscriptionLoading: boolean
  profile: User | null
  isProfileLoading: boolean
  clerkUser: any | null
  lastFetched: number | null
  balance: number | null
  isBalanceLoading: boolean
}

export const userStateAtom = atom<UserState>({
  subscription: null,
  isSubscriptionLoading: false,
  profile: null,
  isProfileLoading: false,
  clerkUser: null,
  lastFetched: null,
  balance: null,
  isBalanceLoading: false,
})

// 5 minutes cache
export const CACHE_DURATION = 5 * 60 * 1000
