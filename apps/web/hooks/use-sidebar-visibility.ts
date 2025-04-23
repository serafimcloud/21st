"use client"

import { usePathname } from "next/navigation"
import { useIsMobile } from "@/hooks/use-media-query"
import * as React from "react"

export function useSidebarVisibility() {
  const pathname = usePathname()
  const isMobile = useIsMobile()

  // Don't show sidebar on mobile devices
  if (isMobile) {
    return false
  }

  // Show sidebar only on specific pages
  const shouldShowSidebar =
    pathname === "/" ||
    pathname.startsWith("/s/") ||
    pathname.startsWith("/q/") ||
    pathname.startsWith("/c/") ||
    pathname.startsWith("/magic/get-started") ||
    pathname.startsWith("/magic/console") ||
    pathname.startsWith("/contest")

  return shouldShowSidebar
}
