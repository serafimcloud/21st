"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/ui/user-avatar"
import { User } from "@/types/global"
import {
  BarChartBig,
  CreditCard,
  Layers,
  Home,
  Settings,
  ArrowLeft,
} from "lucide-react"
import { useAtom } from "jotai"
import { userStateAtom } from "@/lib/store/user-store"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react"
import { partnerModalOpenAtom } from "@/app/studio/[username]/analytics/page.client"

interface StudioSidebarProps {
  user: User
}

export function StudioSidebar({ user }: StudioSidebarProps) {
  const pathname = usePathname()
  const [userState] = useAtom(userStateAtom)
  const isPartner = userState?.profile?.is_partner || false
  const [currentHash, setCurrentHash] = useState("")
  const [, setPartnerModalOpen] = useAtom(partnerModalOpenAtom)

  // Get the base username path
  const baseUsername = user.display_username || user.username
  const basePath = `/studio/${baseUsername}`

  // Update hash on client side
  useEffect(() => {
    const updateHash = () => {
      setCurrentHash(window.location.hash)
    }

    // Set initial hash
    if (typeof window !== "undefined") {
      updateHash()
    }

    // Listen for hash changes
    window.addEventListener("hashchange", updateHash)
    return () => window.removeEventListener("hashchange", updateHash)
  }, [])

  // Check which item should be active
  const isComponentsActive = pathname === basePath
  const isAnalyticsActive = pathname.includes("/analytics")
  const isMonetizationActive = pathname.includes("/monetization")

  // Handle click on Monetization menu item
  const handleMonetizationClick = (e: React.MouseEvent) => {
    if (!isPartner) {
      // Only handle for non-partners
      setPartnerModalOpen(true)
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex flex-col items-center py-4">
          <UserAvatar
            src={user.display_image_url || user.image_url || "/placeholder.svg"}
            alt={user.display_name || user.name || ""}
            size={64}
            className="mb-4"
          />
          <h2 className="text-xl font-medium text-center">
            {user.display_name || user.name || user.username}
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            @{user.display_username || user.username}
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href={basePath} className="flex items-center gap-2">
              <SidebarMenuButton isActive={isComponentsActive}>
                <Layers className="h-4 w-4" />
                <span>Components</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link
              href={`${basePath}/analytics`}
              className="flex items-center gap-2"
            >
              <SidebarMenuButton isActive={isAnalyticsActive}>
                <BarChartBig className="h-4 w-4" />
                <span>Analytics</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link
              href={
                isPartner
                  ? `${basePath}/monetization`
                  : `${basePath}/analytics#monetization`
              }
              className="flex items-center gap-2"
              onClick={handleMonetizationClick}
            >
              <SidebarMenuButton isActive={isMonetizationActive}>
                <CreditCard className="h-4 w-4" />
                <span>Monetization</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <Link
          href="/settings/profile"
          className="flex w-full items-center gap-2 h-9 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
        <Link
          href="/"
          className="flex w-full items-center gap-2 h-9 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to 21st.dev</span>
        </Link>
      </SidebarFooter>
    </Sidebar>
  )
}
