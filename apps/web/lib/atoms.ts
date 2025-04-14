import { atom } from "jotai"

export type AppSection =
  | "components"
  | "templates"
  | "categories"
  | "authors"
  | "pro"
  | "collections"
  | "magic"

export type TabChangeHandler = (tab: Exclude<AppSection, "magic">) => void

// This atom will store the tab change handler function
export const tabChangeHandlerAtom = atom<TabChangeHandler | null>(null)

// Current section the user is in
export const currentSectionAtom = atom<AppSection>("components")

// Selected tab on the main page
export const selectedMainTabAtom =
  atom<Exclude<AppSection, "magic">>("components")

/**
 * Helper function to generate a URL for the main page with a specific tab
 */
export const getMainPageUrlWithTab = (
  tab: Exclude<AppSection, "magic">,
  sortBy?: string,
): string => {
  const params = new URLSearchParams()
  params.set("tab", tab)
  if (tab === "components" && sortBy) {
    params.set("sort", sortBy)
  }
  return `/?${params.toString()}`
}
