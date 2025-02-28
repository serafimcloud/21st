"use client"

import * as React from "react"
import { categories } from "@/lib/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"
import { Icons } from "@/components/icons"
import { usePathname } from "next/navigation"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { ArrowUpRight } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
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
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null)
  const pathname = usePathname()

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
              <div className="flex items-center">
                {category.title}
                {category.isNew && (
                  <span className="ml-2 rounded-md bg-[#adfa1d] px-1.5 py-0.5 text-xs leading-none text-[#000000]">
                    New
                  </span>
                )}
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {category.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href === "/magic/get-started" &&
                      pathname.startsWith("/magic/get-started"))

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "w-full flex items-center justify-between group",
                            isActive && "bg-accent font-medium",
                          )}
                          target={item.externalLink ? "_blank" : undefined}
                          rel={
                            item.externalLink
                              ? "noopener noreferrer"
                              : undefined
                          }
                          onMouseEnter={() => setHoveredItem(item.title)}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          <span className="flex items-center">
                            {item.title}
                            {item.isNew && (
                              <span className="ml-2 rounded-md bg-[#adfa1d] px-1.5 py-0.5 text-xs leading-none text-[#000000]">
                                New
                              </span>
                            )}
                          </span>
                          <span className="text-muted-foreground text-sm flex items-center">
                            {item.externalLink &&
                              hoveredItem === item.title && (
                                <ArrowUpRight className="ml-1 h-3.5 w-3.5 transition-opacity" />
                              )}
                            {item.demosCount}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
