"use client"

import { Header } from "@/components/ui/header.client"
import { StudioSidebar } from "./studio-sidebar"
import { User } from "@/types/global"
import { ReactNode } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

interface StudioLayoutProps {
  user: User
  children: ReactNode
}

export function StudioLayout({ user, children }: StudioLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 pt-14">
        <SidebarProvider defaultOpen={true}>
          <StudioSidebar user={user} />
          <SidebarInset className="p-8">{children}</SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  )
}
