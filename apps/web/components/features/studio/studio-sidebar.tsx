"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/ui/user-avatar"
import { User } from "@/types/global"
import { BarChartBig, CreditCard, Layers } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface StudioSidebarProps {
  user: User
}

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  disabled?: boolean
}

export function StudioSidebar({ user }: StudioSidebarProps) {
  const pathname = usePathname()

  // Get the base username path
  const baseUsername = user.display_username || user.username
  const basePath = `/studio/${baseUsername}`

  const navItems: NavItem[] = [
    {
      title: "Components",
      href: basePath,
      icon: <Layers className="h-4 w-4" />,
    },
    {
      title: "Analytics",
      href: `${basePath}/analytics`,
      icon: <BarChartBig className="h-4 w-4" />,
      disabled: true,
    },
    {
      title: "Monetization",
      href: `${basePath}/monetization`,
      icon: <CreditCard className="h-4 w-4" />,
      disabled: true,
    },
  ]

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
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link
                href={item.disabled ? "#" : item.href}
                passHref
                legacyBehavior
              >
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  className={cn(
                    item.disabled &&
                      "opacity-50 cursor-not-allowed pointer-events-none",
                  )}
                >
                  <a className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.title}</span>
                    {item.disabled && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Soon
                      </span>
                    )}
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <Link
          href="/settings/profile"
          className="flex w-full items-center gap-2 p-3 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
        >
          <span>Settings</span>
        </Link>
      </SidebarFooter>
    </Sidebar>
  )
}
