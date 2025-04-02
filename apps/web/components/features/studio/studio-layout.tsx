"use client"

import { Header } from "@/components/ui/header.client"
import { Footer } from "@/components/ui/footer"
import { StudioSidebar } from "./studio-sidebar"
import { User } from "@/types/global"
import { ReactNode } from "react"

interface StudioLayoutProps {
  user: User
  children: ReactNode
}

export function StudioLayout({ user, children }: StudioLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 pt-14">
        <StudioSidebar user={user} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
      <Footer />
    </div>
  )
}
