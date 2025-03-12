"use client"

import { usePathname } from "next/navigation"

export function useSidebarVisibility() {
  const pathname = usePathname()

  // Show sidebar only on main page, tag pages and search results
  const shouldShowSidebar =
    pathname === "/" ||
    pathname.startsWith("/s/") ||
    pathname.startsWith("/q/") ||
    pathname.startsWith("/c/") ||
    pathname.startsWith("/magic/get-started") ||
    pathname.startsWith("/magic/console")

  return shouldShowSidebar
}
