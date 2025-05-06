import { useIsAdmin } from "@/components/features/publish/hooks/use-is-admin"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { componentAccessAtom, userStateAtom } from "@/lib/store/user-store"
import { Component } from "@/types/global"
import { useUser } from "@clerk/nextjs"
import { useAtom } from "jotai"

export type ComponentAccessState =
  | "UNLOCKED" // Component is accessible (free or purchased)
  | "REQUIRES_SUBSCRIPTION" // Subscription required for paid component
  | "REQUIRES_UNLOCK" // TODO: Reimplement logic // Has subscription and tokens but needs to unlock paid component
  | "HIDDEN"

export function useComponentAccess(
  component: Component,
  initialHasPurchased: boolean = false,
) {
  const [userState] = useAtom(userStateAtom)
  const [componentAccess] = useAtom(componentAccessAtom)
  const { subscription, balance } = userState
  const { user, isSignedIn } = useUser()
  const supabase = useClerkSupabaseClient()
  const isAdmin = useIsAdmin()

  // Determine access state based on component and user state
  if (!isSignedIn || !subscription) {
    return "REQUIRES_SUBSCRIPTION" as const
  }

  // If the component is not owned by the user, hide it
  if (!isAdmin && !component.is_public && component.user_id !== user?.id) {
    return "HIDDEN" as const
  }

  return "UNLOCKED" as const
}
