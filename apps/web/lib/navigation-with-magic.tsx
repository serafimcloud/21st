"use client"

import { categories as originalCategories } from "./navigation"
import { magicOnboardingCompletedAtom } from "@/components/features/magic/get-started/onboarding-server-wrapper"
import { useAtomValue } from "jotai"
import { useAuth } from "@clerk/nextjs"

// Define the types based on the navigation.ts file
export type NavigationItem = {
  title: string
  href: string
  isNew?: boolean
  demoId?: number
  demosCount?: number
  externalLink?: boolean
}

export type NavigationCategory = {
  title: string
  icon: any
  items: NavigationItem[]
  isNew?: boolean
}

export function useFilteredNavigation() {
  const magicOnboardingCompleted = useAtomValue(magicOnboardingCompletedAtom)
  const { userId } = useAuth()

  // Deep clone the categories to avoid mutating the original
  const categories = JSON.parse(
    JSON.stringify(originalCategories),
  ) as NavigationCategory[]

  // Find Magic AI Agent category
  const magicCategory = categories.find(
    (cat: NavigationCategory) => cat.title === "Magic AI Agent",
  )

  if (magicCategory) {
    // Filter items based on authentication and onboarding status
    magicCategory.items = magicCategory.items.filter((item: NavigationItem) => {
      // Always show About and Onboarding
      if (item.title === "About" || item.title === "Onboarding") {
        return true
      }

      // Show Console only if user is authenticated
      if (item.title === "Console") {
        return !!userId
      }

      return true
    })

    // If onboarding is completed and user is authenticated, remove onboarding
    if (magicOnboardingCompleted && userId) {
      magicCategory.items = magicCategory.items.filter(
        (item: NavigationItem) => item.title !== "Onboarding",
      )
    }
  }

  return categories
}
