"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User } from "@/types/global"
import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/user-nav"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface StudioHeaderProps {
  user: User
}

export function StudioHeader({ user }: StudioHeaderProps) {
  const pathname = usePathname()

  return (
    <header className="h-16 border-b border-border sticky top-0 z-50 bg-background flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center">
        <Link href="/" className="flex items-center gap-2 mr-8">
          <img
            src="/logo.svg"
            alt="21st.dev"
            width={30}
            height={30}
            className="dark:invert"
          />
          <span className="font-semibold text-lg hidden md:inline-block">
            21st.dev <span className="text-primary">Studio</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-4">
          <Link
            href="/studio/dashboard"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname.includes("/studio/dashboard") &&
                !pathname.includes("/analytics") &&
                !pathname.includes("/monetization") &&
                !pathname.includes("/settings")
                ? "text-primary"
                : "text-muted-foreground",
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/studio/dashboard/analytics"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname.includes("/analytics")
                ? "text-primary"
                : "text-muted-foreground",
            )}
          >
            Analytics
          </Link>
          <Link
            href="/studio/dashboard/monetization"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname.includes("/monetization")
                ? "text-primary"
                : "text-muted-foreground",
            )}
          >
            Monetization
          </Link>
          <Link
            href="/studio/dashboard/settings"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname.includes("/settings")
                ? "text-primary"
                : "text-muted-foreground",
            )}
          >
            Settings
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search components..."
            className="w-64 pl-8 rounded-full bg-muted"
          />
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserNav user={user} />
        </div>
      </div>
    </header>
  )
}
