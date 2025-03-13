import { useAtom } from "jotai"
import { userStateAtom, componentAccessAtom } from "@/lib/store/user-store"
import { Component } from "@/types/global"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"

export type ComponentAccessState =
  | "UNLOCKED" // Component is accessible (free or purchased)
  | "REQUIRES_SUBSCRIPTION" // Subscription required for paid component
  | "REQUIRES_TOKENS" // Has subscription but needs tokens for paid component
  | "REQUIRES_UNLOCK" // Has subscription and tokens but needs to unlock paid component

export function useComponentAccess(
  component: Component,
  initialHasPurchased: boolean = false,
) {
  const [userState] = useAtom(userStateAtom)
  const [componentAccess] = useAtom(componentAccessAtom)
  const { subscription, balance } = userState
  const { user, isSignedIn } = useUser()
  const supabase = useClerkSupabaseClient()

  // Query for purchase status - always run this query but control when it's enabled
  const { data: hasPurchased } = useQuery({
    queryKey: ["component-purchase", component.id, user?.id],
    queryFn: async () => {
      if (!user?.id) return false

      // Check atom state first
      if (
        componentAccess.componentId === component.id &&
        componentAccess.accessState === "UNLOCKED"
      ) {
        return true
      }

      const { data } = await supabase
        .from("components_purchases")
        .select("*")
        .eq("user_id", user.id)
        .eq("component_id", component.id)
        .single()

      return !!data
    },
    enabled: !!user?.id && !!component.id && component.is_paid,
    initialData:
      initialHasPurchased ||
      (componentAccess.componentId === component.id &&
        componentAccess.accessState === "UNLOCKED"),
  })

  // Determine access state based on component and user state
  if (
    !component.is_paid ||
    hasPurchased ||
    (user?.id && component.user_id === user.id)
  ) {
    return "UNLOCKED" as const
  }

  if (!isSignedIn) {
    return "REQUIRES_SUBSCRIPTION" as const
  }

  if (!subscription) {
    return "REQUIRES_SUBSCRIPTION" as const
  }

  if (balance !== null && balance < component.price) {
    return "REQUIRES_TOKENS" as const
  }

  if (balance !== null && balance >= component.price) {
    return "REQUIRES_UNLOCK" as const
  }

  return "REQUIRES_SUBSCRIPTION" as const
}
