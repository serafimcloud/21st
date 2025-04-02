"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { User } from "@/types/global"
import { Tables } from "@/types/supabase"
import { StudioSidebar } from "./studio-sidebar"
import { StudioHeader } from "./studio-header"
import { StudioContentTable } from "./studio-content-table"
import { StudioAnalytics } from "./studio-analytics"
import { StudioMonetization } from "./studio-monetization"
import { StudioSettings } from "./studio-settings"
import { Footer } from "@/components/ui/footer"

interface StudioDashboardLayoutProps {
  user: User
  components: Tables<"components">[]
  activeTab: "content" | "analytics" | "monetization" | "settings"
}

export function StudioDashboardLayout({
  user,
  components,
  activeTab,
}: StudioDashboardLayoutProps) {
  const pathname = usePathname()

  // Determine which tab content to show
  const renderTabContent = () => {
    switch (activeTab) {
      case "content":
        return <StudioContentTable components={components} user={user} />
      case "analytics":
        return <StudioAnalytics user={user} />
      case "monetization":
        return <StudioMonetization user={user} />
      case "settings":
        return <StudioSettings user={user} />
      default:
        return <StudioContentTable components={components} user={user} />
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <StudioHeader user={user} />
      <div className="flex flex-1">
        <StudioSidebar user={user} activeTab={activeTab} />
        <main className="flex-1 pt-16 pb-12 overflow-y-auto">
          <div className="px-6 py-8">{renderTabContent()}</div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
