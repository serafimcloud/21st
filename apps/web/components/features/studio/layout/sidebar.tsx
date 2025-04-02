"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User } from "@/types/global"
import { UserAvatar } from "@/components/ui/user-avatar"
import { cn } from "@/lib/utils"
import {
  LayoutGrid,
  BarChart2,
  DollarSign,
  Settings,
  PlusCircle,
  Home,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ComponentPublishForm } from "./component-publish-form"
import { useState } from "react"

interface StudioSidebarProps {
  user: User
  activeTab: "content" | "analytics" | "monetization" | "settings"
}

export function StudioSidebar({ user, activeTab }: StudioSidebarProps) {
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)

  // Navigation items
  const navItems = [
    {
      name: "Content",
      href: "/studio/dashboard",
      icon: LayoutGrid,
      active: activeTab === "content",
    },
    {
      name: "Analytics",
      href: "/studio/dashboard/analytics",
      icon: BarChart2,
      active: activeTab === "analytics",
    },
    {
      name: "Monetization",
      href: "/studio/dashboard/monetization",
      icon: DollarSign,
      active: activeTab === "monetization",
    },
    {
      name: "Settings",
      href: "/studio/dashboard/settings",
      icon: Settings,
      active: activeTab === "settings",
    },
  ]

  // Utility links
  const utilityLinks = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Documentation",
      href: "/docs",
      icon: BookOpen,
    },
  ]

  return (
    <aside className="w-64 bg-background border-r border-border flex-shrink-0 h-[calc(100vh-4rem)] sticky top-16">
      <div className="h-full flex flex-col">
        <div className="p-6">
          <Dialog
            open={isPublishDialogOpen}
            onOpenChange={setIsPublishDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="w-full" size="lg">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Component
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[725px]">
              <DialogHeader>
                <DialogTitle>Publish New Component</DialogTitle>
                <DialogDescription>
                  Paste your component code below. Make sure it follows our
                  guidelines and includes all necessary imports.
                </DialogDescription>
              </DialogHeader>
              <ComponentPublishForm
                user={user}
                onSuccess={() => setIsPublishDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="p-3 px-4 flex items-center gap-3 border-y border-border">
          <UserAvatar
            src={user.display_image_url || user.image_url || "/placeholder.svg"}
            alt={user.display_name || user.name || ""}
            size={40}
          />
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">
              {user.display_name || user.name || user.username}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              @{user.display_username || user.username}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          <div className="space-y-1 px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  item.active
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground/70 hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Quick Links
            </div>
            <div className="space-y-1 px-3">
              {utilityLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-accent/50 hover:text-foreground"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  )
}
