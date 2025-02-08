"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useAtom } from "jotai"
import { sidebarOpenAtom } from "@/components/features/main-page/main-layout"
import { useSidebarVisibility } from "@/hooks/use-sidebar-visibility"

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

  return (
    <div
      className={cn(
        "relative mx-auto w-full transition-all duration-200",
        className,
      )}
      style={{
        width: "min(100%, 3680px)",
        maxWidth: hasSidebar ? "calc(100vw - 256px)" : "100vw",
      }}
    >
      {children}
    </div>
  )
}
