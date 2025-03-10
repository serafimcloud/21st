import { atomWithStorage } from "jotai/utils"
import { PlanInfo } from "@/hooks/use-subscription"
import type { User } from "@/types/global"
import type { PrimitiveAtom } from "jotai/vanilla"
import { atom } from "jotai"

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

export const userStateAtom: PrimitiveAtom<UserState> =
  atomWithStorage<UserState>("user_state", {
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

// Atom to track component access state changes
export const componentAccessAtom = atom<{
  componentId: number | null
  accessState: "UNLOCKED" | null
}>({
  componentId: null,
  accessState: null,
})
