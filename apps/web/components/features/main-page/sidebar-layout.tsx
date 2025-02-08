"use client"

import * as React from "react"
import { categories } from "@/lib/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"
import { Icons } from "@/components/icons"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

export function MainSidebar() {
  const { toggleSidebar } = useSidebar()
  const [showTrigger, setShowTrigger] = React.useState(true)

  return (
    <Sidebar className="hidden md:block">
      <div className="h-14 flex items-center justify-end pr-4">
        <div className="relative h-8 w-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label="Toggle Sidebar"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleSidebar()
                }}
                className={cn(
                  "absolute inset-0 flex items-center justify-center rounded-sm cursor-pointer text-foreground transition-all duration-300 hover:bg-accent",
                  showTrigger ? "opacity-100 scale-100" : "opacity-0 scale-90",
                )}
              >
                <Icons.sidebar className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              className="flex items-center gap-1.5 z-50"
              side="right"
            >
              <span>Toggle Sidebar</span>
              <kbd className="pointer-events-none h-5 text-muted-foreground select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 flex text-[11px] leading-none font-sans">
                S
              </kbd>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <SidebarContent className="pb-14">
        {categories.map((category) => (
          <SidebarGroup key={category.title}>
            <SidebarGroupLabel className="text-sm font-semibold text-foreground">
              {category.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {category.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.href}
                        className="w-full flex items-center justify-between"
                      >
                        <span className="flex items-center">
                          {item.title}
                          {item.isNew && (
                            <span className="ml-2 rounded-md bg-[#adfa1d] px-1.5 py-0.5 text-xs leading-none text-[#000000]">
                              New
                            </span>
                          )}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {item.demosCount}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
