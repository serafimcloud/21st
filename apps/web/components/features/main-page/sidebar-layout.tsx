"use client"

import * as React from "react"
import { categories } from "@/lib/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"
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
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  role="img"
                  focusable="false"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M15 5.25A3.25 3.25 0 0 0 11.75 2h-7.5A3.25 3.25 0 0 0 1 5.25v5.5A3.25 3.25 0 0 0 4.25 14h7.5A3.25 3.25 0 0 0 15 10.75v-5.5Zm-3.5 7.25H7v-9h4.5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2Zm-6 0H4.25a1.75 1.75 0 0 1-1.75-1.75v-5.5c0-.966.784-1.75 1.75-1.75H5.5v9Z" />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent
              className="flex items-center gap-1.5 z-[200]"
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
                        className={cn(
                          "w-full",
                          item.isNew &&
                            "after:ml-2 after:rounded-md after:bg-[#adfa1d] after:px-1.5 after:py-0.5 after:text-xs after:leading-none after:text-[#000000] after:no-underline after:group-hover:no-underline after:content-['New']",
                        )}
                      >
                        <span>{item.title}</span>
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
