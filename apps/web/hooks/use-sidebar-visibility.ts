"use client"

import { usePathname } from "next/navigation"

export function useSidebarVisibility() {
  const pathname = usePathname()

  // Show sidebar only on main page, tag pages and search results
  const shouldShowSidebar =
    pathname === "/" || pathname.startsWith("/s/") || pathname.startsWith("/q/")

  return shouldShowSidebar
}
