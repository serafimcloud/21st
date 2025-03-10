import { useAtom } from "jotai"
import { userStateAtom } from "@/lib/store/user-store"
import { Component } from "@/types/global"

export type ComponentAccessState =
  | "UNLOCKED" // Component is accessible (has subscription and tokens)
  | "REQUIRES_SUBSCRIPTION" // Subscription required 
  | "REQUIRES_TOKENS" // Has subscription but needs tokens
  | "REQUIRES_UNLOCK" // Has subscription and tokens but needs to unlock

export function useComponentAccess(component: Component) {
  const [userState] = useAtom(userStateAtom)
  const { subscription, balance } = userState

  if (!subscription) {
    return "REQUIRES_SUBSCRIPTION" as const
  }

  // Use component price as token cost
  if (balance !== null && balance < component.price) {
    return "REQUIRES_TOKENS" as const
  }

  // Component needs to be unlocked with tokens
  const hasEnoughTokens = balance !== null && balance >= component.price
  if (hasEnoughTokens) {
    return "REQUIRES_UNLOCK" as const
  }

  return "UNLOCKED" as const
}
