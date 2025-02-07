"use client"

import { useEffect } from "react"

import { ClerkProvider } from "@clerk/nextjs"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SpeedInsights } from "@vercel/speed-insights/next"

import { CommandMenu } from "@/components/ui/command-menu"
import { SidebarProvider } from "@/components/ui/sidebar"
import { MainSidebar } from "@/components/features/main-page/sidebar-layout"
import { MainLayout } from "@/components/features/main-page/main-layout"

import { initAmplitude } from "@/lib/amplitude"
import { useAtom } from "jotai"
import { sidebarOpenAtom } from "@/lib/atoms/sidebar"

const queryClient = new QueryClient()

export function AppProviders({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const [open, setOpen] = useAtom(sidebarOpenAtom)

  useEffect(() => {
    initAmplitude()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider>
        <SidebarProvider defaultOpen={open} open={open} onOpenChange={setOpen}>
          <MainSidebar />
          <MainLayout>
            <CommandMenu />
            <SpeedInsights />
            {children}
          </MainLayout>
        </SidebarProvider>
      </ClerkProvider>
    </QueryClientProvider>
  )
}
