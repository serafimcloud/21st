"use client"

import { partnerModalOpenAtom } from "@/app/studio/[username]/analytics/page.client"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { UserAvatar } from "@/components/ui/user-avatar"
import { userStateAtom } from "@/lib/store/user-store"
import { cn } from "@/lib/utils"
import { User } from "@/types/global"
import { useAtom } from "jotai"
import {
  BarChartBig,
  CreditCard,
  Home,
  Layers,
  Package,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

interface StudioSidebarProps {
  user: User
}

export function StudioSidebar({ user }: StudioSidebarProps) {
  const pathname = usePathname()
  const [userState] = useAtom(userStateAtom)
  const [currentHash, setCurrentHash] = useState("")
  const [, setPartnerModalOpen] = useAtom(partnerModalOpenAtom)
  const { open } = useSidebar()

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
  const isBundlesActive = pathname.includes("/bundles")
  const isAnalyticsActive = pathname.includes("/analytics")
  const isMonetizationActive = pathname.includes("/monetization")

  return (
    <Sidebar
      className="z-4 pt-14  bg-background border-r-transparent border-none"
      collapsible="icon"
    >
      <SidebarHeader className="border-b bg-background">
        <div className="flex flex-col items-center py-4">
          <UserAvatar
            src={user.display_image_url || user.image_url || "/placeholder.svg"}
            alt={user.display_name || user.name || ""}
            size={open ? 48 : 24}
            className={cn(
              "transition-all duration-300 ease-in-out",
              open ? "mb-4" : "mb-0",
            )}
          />
          <div
            className={cn(
              "flex flex-col items-center transition-all duration-300 ease-in-out overflow-hidden",
              open ? "max-h-16 opacity-100 mt-1" : "max-h-0 opacity-0 mt-0",
            )}
          >
            <h2 className="text-xl font-medium text-center">
              {user.display_name || user.name || user.username}
            </h2>
            <p className="text-sm text-muted-foreground text-center">
              @{user.display_username || user.username}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4  bg-background">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href={basePath} className="flex items-center gap-2">
              <SidebarMenuButton
                isActive={isComponentsActive}
                tooltip="Components"
              >
                <Layers className="h-4 w-4" />
                <span>Components</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link
              href={`${basePath}/bundles`}
              className="flex items-center gap-2"
            >
              <SidebarMenuButton isActive={isBundlesActive}>
                <Package className="h-4 w-4" />
                <span>Bundles</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link
              href={`${basePath}/analytics`}
              className="flex items-center gap-2"
            >
              <SidebarMenuButton
                isActive={isAnalyticsActive}
                tooltip="Analytics"
              >
                <BarChartBig className="h-4 w-4" />
                <span>Analytics</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link
              href={`${basePath}/monetization`}
              className="flex items-center gap-2"
            >
              <SidebarMenuButton
                isActive={isMonetizationActive}
                tooltip="Monetization"
              >
                <CreditCard className="h-4 w-4" />
                <span>Monetization</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t bg-background">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/settings/profile" className="flex items-center gap-2">
              <SidebarMenuButton tooltip="Settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link href="/" className="flex items-center gap-2">
              <SidebarMenuButton tooltip="Home">
                <Home className="h-4 w-4" />
                <span>Back to 21st.dev</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
