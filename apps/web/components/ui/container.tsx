"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useAtom } from "jotai"
import { sidebarOpenAtom } from "@/components/features/main-page/main-layout"
import { useSidebarVisibility } from "@/hooks/use-sidebar-visibility"
import { useIsMobile } from "@/hooks/use-media-query"

export function Container({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const [open] = useAtom(sidebarOpenAtom)
  const shouldShowSidebar = useSidebarVisibility()
  const hasSidebar = shouldShowSidebar && open
  const isMobile = useIsMobile()

  // Server-side rendering always defaults to mobile view first to avoid width jumps
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Always use mobile layout before hydration is complete
  const shouldAdjustForSidebar = mounted && !isMobile && hasSidebar

  return (
    <div
      className={cn(
        "relative mx-auto w-full transition-all duration-200",
        className,
      )}
      style={{
        width: "min(100%, 3680px)",
        maxWidth: shouldAdjustForSidebar ? "calc(100vw - 256px)" : "100vw",
      }}
    >
      {children}
    </div>
  )
}
