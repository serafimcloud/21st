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
  | "bundles"

export type MainTabType = Exclude<AppSection, "magic">

export type TabChangeHandler = (tab: MainTabType | "home") => void

export const tabChangeHandlerAtom = atom<TabChangeHandler | null>(null)

export const currentSectionAtom = atom<AppSection>("home")

export const selectedMainTabAtom = atom<MainTabType | "home">("home")

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
