"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, User, CreditCard, Wallet, BookText, ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function SettingsSidebar() {
  const pathname = usePathname()

  const items = [
    {
      href: "/settings/profile",
      title: "Profile",
      icon: <User className="h-3.5 w-3.5" />,
    },
    {
      href: "/settings/billing",
      title: "Billing",
      icon: <CreditCard className="h-3.5 w-3.5" />,
    },
    {
      href: "/settings/rules",
      title: "Prompt Rules",
      icon: <BookText className="h-3.5 w-3.5" />,
    },
  ]

  return (
    <nav className="grid items-start gap-2 pt-2">
      <Button
        variant="ghost"
        size="sm"
        className="flex h-8 items-center justify-start gap-2 text-xs text-muted-foreground"
        asChild
      >
        <Link href="/">
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Back to app</span>
        </Link>
      </Button>

      <div className="mt-6">
        <h2 className="mb-2 px-4 text-xs font-medium tracking-tight">
          Settings
        </h2>
        <div className="space-y-1">
          {items.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "w-full justify-start gap-2 h-8 text-xs",
                pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
              )}
              asChild
            >
              <Link href={item.href}>
                {item.icon}
                {item.title}
              </Link>
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-8 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            asChild
          >
            <Link href="/studio">
              <Wallet className="h-3.5 w-3.5" />
              <span className="truncate">Payouts moved to Studio</span>
              <ArrowUpRight className="ml-auto h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
