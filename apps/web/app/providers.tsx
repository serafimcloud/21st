"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

import { ClerkProvider } from "@clerk/nextjs"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SpeedInsights } from "@vercel/speed-insights/next"

import { CommandMenu } from "@/components/ui/command-menu"
import { ProductHuntDialog } from "@/components/ui/product-hunt-dialog"

import { initAmplitude } from "@/lib/amplitude"

const queryClient = new QueryClient()

export function AppProviders({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  useEffect(() => {
    initAmplitude()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider>
        <CommandMenu />
        <ProductHuntDialog />
        <SpeedInsights />
        {children}
      </ClerkProvider>
    </QueryClientProvider>
  )
}
