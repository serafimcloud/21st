import { ComponentAccessState } from "@/hooks/use-component-access"
import { PlanInfo } from "@/hooks/use-subscription"
import type { User } from "@/types/global"
import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import type { PrimitiveAtom } from "jotai/vanilla"

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
  accessState: ComponentAccessState
}>({
  componentId: null,
  accessState: "UNDEFINED",
})
