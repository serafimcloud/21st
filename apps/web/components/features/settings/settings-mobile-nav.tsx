"use client"

import * as React from "react"
import Link from "next/link"
// @ts-ignore
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Icons } from "@/components/icons"

const settingsLinks = [
  {
    title: "Profile",
    href: "/settings/profile",
  },
  {
    title: "Billing",
    href: "/settings/billing",
  },
  {
    title: "Payouts moved to Studio",
    href: "/settings/payouts",
  },
]

export function SettingsMobileNav() {
  const pathname = usePathname()
  const currentTitle =
    settingsLinks.find((link) => pathname?.startsWith(link.href))?.title ||
    "Profile"

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="flex items-center justify-between p-4">
        <div className="flex gap-2 items-center">
          <Link
            href="/"
            className="flex items-center justify-center w-[22px] h-[22px] rounded-full cursor-pointer bg-foreground"
          />
          <div className="flex items-center gap-2">
            <Icons.slash className="text-border w-[22px] h-[22px]" />
            <h1 className="text-[14px] font-medium">Settings</h1>
          </div>
          <Icons.slash className="text-border w-[22px] h-[22px]" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 h-auto py-1 px-2"
              >
                <span className="text-[14px] font-medium">{currentTitle}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              {settingsLinks.map((link) => (
                <DropdownMenuItem
                  key={link.href}
                  className={pathname?.startsWith(link.href) ? "bg-accent" : ""}
                  asChild
                >
                  <Link href={link.href}>{link.title}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
