"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useAtom } from "jotai"
import { sidebarOpenAtom } from "@/components/features/main-page/main-layout"

export function Container({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const [open] = useAtom(sidebarOpenAtom)

  return (
    <div
      className={cn(
        "relative mx-auto w-full transition-all duration-200",
        open
          ? "px-2.5 md:px-3 lg:px-4 xl:px-5 2xl:px-10"
          : "px-5 md:px-6 lg:px-8 xl:px-10 2xl:px-20",
        className,
      )}
      style={{
        width: "min(100%, 3680px)",
        maxWidth: open ? "calc(100vw - 256px)" : "100vw",
      }}
    >
      {children}
    </div>
  )
}
