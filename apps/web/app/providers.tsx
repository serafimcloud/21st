"use client"

import { useEffect, Suspense } from "react"

import { ClerkProvider } from "@clerk/nextjs"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { CommandMenu } from "@/components/ui/command-menu"
import { SidebarProvider } from "@/components/ui/sidebar"
import { MainSidebar } from "@/components/features/main-page/sidebar-layout"
import { MainLayout } from "@/components/features/main-page/main-layout"
import { useSidebarVisibility } from "@/hooks/use-sidebar-visibility"

import { initAmplitude } from "@/lib/amplitude"
import { useAtom } from "jotai"
import { sidebarOpenAtom } from "@/components/features/main-page/main-layout"

const queryClient = new QueryClient()

export function AppProviders({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  const [open, setOpen] = useAtom(sidebarOpenAtom)
  const shouldShowSidebar = useSidebarVisibility()

  useEffect(() => {
    initAmplitude()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider>
        <SidebarProvider defaultOpen={open} open={open} onOpenChange={setOpen}>
          <Suspense fallback={null}>
            {shouldShowSidebar && <MainSidebar />}
          </Suspense>
          <MainLayout>
            <CommandMenu />
            {children}
          </MainLayout>
        </SidebarProvider>
      </ClerkProvider>
    </QueryClientProvider>
  )
}
