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
  /**
   * Whether to automatically update the URL when tab changes
   * @default true
   */
  syncWithUrl?: boolean

  /**
   * Custom callback when tab changes
   */
  onTabChange?: (tab: MainTabType | "home") => void

  /**
   * Whether to use different default tabs based on device
   * @default true
   */
  useResponsiveDefaults?: boolean
}

export interface NavigationResult {
  /**
   * Current active tab
   */
  activeTab: MainTabType | "home"

  /**
   * Current app section
   */
  currentSection: AppSection

  /**
   * Function to navigate to a tab
   */
  navigateToTab: (tab: MainTabType | "home") => void

  /**
   * Whether the current view is desktop
   */
  isDesktop: boolean

  /**
   * Selected sort option (if applicable)
   */
  sortBy: SortOption

  /**
   * Function to handle sort change
   */
  handleSortChange: (value: string) => void
}

/**
 * A hook for handling tab navigation throughout the application
 */
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

  // Global state from Jotai
  const [currentSection, setCurrentSection] = useAtom(currentSectionAtom)
  const [selectedMainTab, setSelectedMainTab] = useAtom(selectedMainTabAtom)
  const [sortBy, setSortBy] = useAtom(sortByAtom)

  // Get the current tab from URL when available
  const urlTab = searchParams.get("tab") as Exclude<AppSection, "magic"> | null

  // Update state based on pathname and URL parameters
  useEffect(() => {
    // Always check for magic path first
    if (pathname.startsWith("/magic")) {
      setCurrentSection("magic")
      return
    }

    // If we're on the main page with a tab parameter
    if (pathname === "/" && urlTab) {
      setCurrentSection("components") // Main section
      setSelectedMainTab(urlTab === "home" ? "home" : urlTab)
      return
    }

    // Default for main page with no tab parameter - set to home
    if (pathname === "/" && !urlTab) {
      // If we should use responsive defaults, select based on device
      if (useResponsiveDefaults) {
        const defaultTab = isDesktop ? "home" : "components"
        setCurrentSection(defaultTab === "home" ? "home" : "components")
        setSelectedMainTab(defaultTab as MainTabType | "home")

        // Update URL if needed
        if (syncWithUrl) {
          const params = new URLSearchParams(searchParams.toString())
          params.set("tab", defaultTab)
          router.push(`?${params.toString()}`, { scroll: false })
        }
      } else {
        // Default to home if not using responsive defaults
        setCurrentSection("home")
        setSelectedMainTab("home")
      }
      return
    }

    // Default for other pages
    if (pathname !== "/") {
      setCurrentSection("components") // Default to components for other pages
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

  // Function to navigate to a tab
  const navigateToTab = (tab: MainTabType | "home") => {
    // Update the selected tab immediately for responsive UI
    setSelectedMainTab(tab)
    setCurrentSection(tab === "home" ? "home" : "components")

    // Call the custom onChange handler if provided
    if (onTabChange) {
      onTabChange(tab)
    }

    // Update URL if syncing with URL
    if (syncWithUrl) {
      const url = getMainPageUrlWithTab(
        tab,
        tab === "components" ? sortBy : undefined,
      )
      router.push(url)
    }
  }

  // Function to handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value as SortOption)

    // Save sort preference in cookie
    setCookie({
      name: "saved_sort_by",
      value: value,
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "lax",
    })

    // Update URL if needed and we're on the components tab
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
