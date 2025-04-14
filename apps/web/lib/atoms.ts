import { atom } from "jotai"

export type AppSection =
  | "home"
  | "components"
  | "templates"
  | "categories"
  | "authors"
  | "pro"
  | "collections"
  | "magic"

export type MainTabType = Exclude<AppSection, "magic">

export type TabChangeHandler = (tab: MainTabType | "home") => void

// This atom will store the tab change handler function
export const tabChangeHandlerAtom = atom<TabChangeHandler | null>(null)

// Current section the user is in
export const currentSectionAtom = atom<AppSection>("components")

// Selected tab on the main page
export const selectedMainTabAtom = atom<MainTabType>("components")

/**
 * Helper function to generate a URL for the main page with a specific tab
 */
export const getMainPageUrlWithTab = (
  tab: MainTabType | "home",
  sortBy?: string,
): string => {
  const params = new URLSearchParams()
  params.set("tab", tab)
  if (tab === "components" && sortBy) {
    params.set("sort", sortBy)
  }
  return `/?${params.toString()}`
}
