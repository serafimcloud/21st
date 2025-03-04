"use client"

import { categories as originalCategories } from "./navigation"
import { magicOnboardingCompletedAtom } from "@/components/features/magic/get-started/onboarding-server-wrapper"
import { useAtomValue } from "jotai"

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

  // Deep clone the categories to avoid mutating the original
  const categories = JSON.parse(
    JSON.stringify(originalCategories),
  ) as NavigationCategory[]

  // Filter out the onboarding item if onboarding is completed
  if (magicOnboardingCompleted) {
    const magicCategory = categories.find(
      (cat: NavigationCategory) => cat.title === "Magic AI Agent",
    )
    if (magicCategory) {
      magicCategory.items = magicCategory.items.filter(
        (item: NavigationItem) => item.title !== "Onboarding",
      )
    }
  }

  return categories
}
