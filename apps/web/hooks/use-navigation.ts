import { useEffect } from "react"
import { useAtom } from "jotai"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  AppSection,
  MainTabType,
  currentSectionAtom,
  selectedMainTabAtom,
  getMainPageUrlWithTab,
} from "@/lib/atoms"
import { sortByAtom } from "@/components/features/main-page/main-page-header"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { SortOption } from "@/types/global"
import { setCookie } from "@/lib/cookies"

export interface UseNavigationOptions {
  syncWithUrl?: boolean
  onTabChange?: (tab: MainTabType | "home") => void
  useResponsiveDefaults?: boolean
}

export interface NavigationResult {
  activeTab: MainTabType | "home"
  currentSection: AppSection
  navigateToTab: (tab: MainTabType | "home") => void
  isDesktop: boolean
  sortBy: SortOption
  handleSortChange: (value: string) => void
}

export function useNavigation(
  options: UseNavigationOptions = {},
): NavigationResult {
  const {
    syncWithUrl = true,
    onTabChange,
    useResponsiveDefaults = true,
  } = options

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const [currentSection, setCurrentSection] = useAtom(currentSectionAtom)
  const [selectedMainTab, setSelectedMainTab] = useAtom(selectedMainTabAtom)
  const [sortBy, setSortBy] = useAtom(sortByAtom)

  const urlTab = searchParams.get("tab") as Exclude<AppSection, "magic"> | null

  useEffect(() => {
    if (pathname.startsWith("/magic")) {
      setCurrentSection("magic")
      return
    }

    if (pathname === "/" && urlTab) {
      setCurrentSection("home")
      setSelectedMainTab(urlTab === "home" ? "home" : urlTab)
      return
    }

    if (pathname === "/" && !urlTab) {
      if (useResponsiveDefaults) {
        const defaultTab = "home"
        setCurrentSection("home")
        setSelectedMainTab(defaultTab as MainTabType | "home")

        if (syncWithUrl) {
          const params = new URLSearchParams(searchParams.toString())
          params.set("tab", defaultTab)
          router.push(`?${params.toString()}`, { scroll: false })
        }
      } else {
        setCurrentSection("home")
        setSelectedMainTab("home")
      }
      return
    }

    if (pathname !== "/") {
      setCurrentSection("home")
    }
  }, [
    pathname,
    urlTab,
    isDesktop,
    setCurrentSection,
    setSelectedMainTab,
    useResponsiveDefaults,
    syncWithUrl,
    router,
    searchParams,
  ])

  const navigateToTab = (tab: MainTabType | "home") => {
    setSelectedMainTab(tab)
    setCurrentSection(tab === "home" ? "home" : "components")

    if (onTabChange) {
      onTabChange(tab)
    }

    if (syncWithUrl) {
      const url = getMainPageUrlWithTab(
        tab,
        tab === "components" ? sortBy : undefined,
      )
      router.push(url)
    }
  }

  const handleSortChange = (value: string) => {
    setSortBy(value as SortOption)

    setCookie({
      name: "saved_sort_by",
      value: value,
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "lax",
    })

    if (syncWithUrl && selectedMainTab === "components") {
      const params = new URLSearchParams(searchParams.toString())
      params.set("sort", value)
      params.set("tab", "components")
      router.push(`?${params.toString()}`, { scroll: false })
    }
  }

  return {
    activeTab: selectedMainTab,
    currentSection,
    navigateToTab,
    isDesktop,
    sortBy,
    handleSortChange,
  }
}
