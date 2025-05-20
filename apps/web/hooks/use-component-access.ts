import { useIsAdmin } from "@/components/features/publish/hooks/use-is-admin"
import { hasUserComponentAccessAction } from "@/lib/api/bundle_purchases"
import { Component } from "@/types/global"
import { useEffect, useState } from "react"

export type ComponentAccessState =
  | "UNLOCKED" // Component is accessible (free or purchased)
  | "REQUIRES_SUBSCRIPTION" // Subscription required for paid component
  | "REQUIRES_UNLOCK" // TODO: Reimplement logic // Has subscription and tokens but needs to unlock paid component
  | "REQUIRES_BUNDLE"
  | "UNDEFINED"
  | "LOCKED"

export function useComponentAccess(
  component: Component,
  initialHasPurchased: boolean = false,
) {
  const [componentAccess, setComponentAccess] =
    useState<ComponentAccessState>("UNDEFINED")
  const isAdmin = useIsAdmin()

  useEffect(() => {
    hasUserComponentAccessAction({ componentId: component.id }).then(
      (hasPurchased) => {
        setComponentAccess(hasPurchased ? "UNLOCKED" : "REQUIRES_BUNDLE")
      },
    )
  }, [component.id])

  return componentAccess
}
