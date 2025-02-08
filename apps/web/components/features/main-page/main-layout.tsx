"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Container } from "@/components/ui/container"
import { useAtom } from "jotai"
import { sidebarOpenAtom } from "@/lib/atoms/sidebar"
import { useSidebarHotkey } from "@/hooks/use-sidebar-hotkey"

export function MainLayout({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const [open] = useAtom(sidebarOpenAtom)
  useSidebarHotkey()

  return (
    <main
      className={cn(
        "min-h-screen w-full",
        className
      )}
    >
      <Container>{children}</Container>
    </main>
  )
}
