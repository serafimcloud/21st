"use client"

import { Icons } from "@/components/icons"
import { SidebarHeader, useSidebar } from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useNavigation } from "@/hooks/use-navigation"
import { AppSection } from "@/lib/atoms"
import {
  categories as defaultCategories,
  magicNavItem,
  mainNavigationItems,
} from "@/lib/navigation"
import { useFilteredNavigation } from "@/lib/navigation-with-magic"
import { userStateAtom } from "@/lib/store/user-store"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { useAtom } from "jotai"
import {
  ArrowUpRight,
  Bookmark,
  Box,
  ChevronRight,
  Component,
  Crown,
  FolderKanban,
  FolderOpen,
  Group,
  Home,
  LayoutTemplate,
  Package,
  Presentation,
  Sparkles,
  Swords,
  Trophy,
  Users,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { Help } from "./help"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Import types from navigation-with-magic.tsx
import { Button } from "@/components/ui/button"
import { TextShimmer } from "@/components/ui/text-shimmer"
import type {
  NavigationCategory,
  NavigationItem,
} from "@/lib/navigation-with-magic"

export function MainSidebar() {
  const { toggleSidebar } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user: clerkUser } = useUser()
  const [userState] = useAtom(userStateAtom)

  const [showTrigger, setShowTrigger] = React.useState(true)
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>(
    [],
  )
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]) // Start with Magic menu closed

  // Use our custom tabs navigation hook
  const { activeTab, currentSection, navigateToTab, sortBy } = useNavigation()

  // Use the filtered navigation that checks if Magic onboarding is completed
  const filteredCategories = useFilteredNavigation()

  // Fall back to default categories if filteredCategories is not available (SSR)
  const categories = filteredCategories || defaultCategories

  // Get the current tab from URL when available
  const urlTab = searchParams.get("tab") as Exclude<AppSection, "magic"> | null

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    )
  }

  // Toggle item expansion (like AI Component Builder)
  const toggleExpandItem = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  // Map navigation value to icon component
  const getIconForNavItem = (value: string) => {
    const item = mainNavigationItems.find((item) => item.value === value)
    if (item) {
      const Icon = item.icon
      return <Icon className="mr-2 h-4 w-4" />
    }
    // Fallbacks
    switch (value) {
      case "home":
        return <Home className="mr-2 h-4 w-4" />
      case "components":
        return <Component className="mr-2 h-4 w-4" />
      case "templates":
        return <LayoutTemplate className="mr-2 h-4 w-4" />
      case "categories":
        return <FolderKanban className="mr-2 h-4 w-4" />
      case "authors":
        return <Users className="mr-2 h-4 w-4" />
      case "pro":
        return <Crown className="mr-2 h-4 w-4" />
      case "collections":
        return <FolderOpen className="mr-2 h-4 w-4" />
      default:
        return <Box className="mr-2 h-4 w-4" />
    }
  }

  const [helpOpen, setHelpOpen] = React.useState(false)

  // Add keyboard event handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Add handler for slash key using code
      if (e.code === "Slash" || e.code === "IntlRo") {
        e.preventDefault()
        setHelpOpen((prev) => !prev)
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Add a useEffect to automatically open Magic menu after 1 second
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setExpandedItems((prev) =>
        prev.includes("magic") ? prev : [...prev, "magic"],
      )
    }, 1000)

    return () => clearTimeout(timer)
  }, []) // Empty dependency array ensures this only runs once on mount

  return (
    <Sidebar className="hidden md:block">
      <SidebarHeader className="h-14" />
      <SidebarContent className="pb-14">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Home and Components first */}
              {mainNavigationItems
                .filter((item) => ["home", "components"].includes(item.value))
                .map((item) => (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton
                      isActive={
                        currentSection !== "magic" &&
                        !pathname.startsWith("/s/") &&
                        ((item.value === "home" &&
                          (urlTab === "home" ||
                            (!urlTab && pathname === "/"))) ||
                          (item.value === "components" &&
                            urlTab === "components") ||
                          (item.value !== "home" &&
                            item.value !== "components" &&
                            activeTab === item.value))
                      }
                      onClick={() =>
                        navigateToTab(
                          item.value as Exclude<AppSection, "magic"> | "home",
                        )
                      }
                    >
                      <div className="flex items-center w-full">
                        {getIconForNavItem(item.value)}
                        {item.title}
                        {item.isNew && (
                          <span className="ml-2 rounded-md bg-[#adfa1d] px-1.5 py-0.5 text-xs leading-none text-[#000000]">
                            New
                          </span>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

              {/* AI Component Builder collapsible menu */}
              <SidebarMenuItem className="group/menu-item relative">
                <SidebarMenuButton
                  isActive={false}
                  onClick={() => toggleExpandItem("magic")}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <Sparkles className="mr-2 h-4 w-4" />
                      {magicNavItem.title}

                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform",
                        expandedItems.includes("magic") &&
                          "transform rotate-90",
                      )}
                    />
                  </div>
                </SidebarMenuButton>

                <AnimatePresence mode="wait">
                  {expandedItems.includes("magic") && (
                    <motion.div
                      key="magic-menu"
                      initial={{
                        height: 0,
                        opacity: 0,
                        marginTop: 0,
                        marginBottom: 0,
                      }}
                      animate={{
                        height: "auto",
                        opacity: 1,
                        marginTop: 4,
                        marginBottom: 4,
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        marginTop: 0,
                        marginBottom: 0,
                      }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="overflow-hidden ml-6 w-auto"
                      style={{ paddingBottom: 0 }}
                    >
                      <div className="flex flex-col gap-0.5">
                        {magicNavItem.subitems.map((subitem, itemIndex) => {
                          const isActive =
                            pathname === subitem.href ||
                            (currentSection === "magic" &&
                              pathname === subitem.href)

                          // Calculate staggered delay
                          const staggerDelay = Math.min(itemIndex * 0.02, 0.15)

                          return (
                            <motion.div
                              key={subitem.title}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              transition={{
                                duration: 0.15,
                                delay: staggerDelay,
                                ease: "easeOut",
                              }}
                            >
                              <div className="mb-0">
                                <SidebarMenuButton asChild isActive={isActive}>
                                  <Link
                                    href={subitem.href}
                                    className={cn(
                                      "flex items-center justify-between w-full",
                                      isActive
                                        ? "bg-accent text-accent-foreground font-medium"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                    )}
                                    target={
                                      subitem.externalLink
                                        ? "_blank"
                                        : undefined
                                    }
                                    rel={
                                      subitem.externalLink
                                        ? "noopener noreferrer"
                                        : undefined
                                    }
                                  >
                                    <span className="flex items-center">
                                      {subitem.title}
                                      {subitem.isNew && (
                                        <span className="ml-2 rounded-md bg-[#adfa1d] px-1.5 py-0.5 text-xs leading-none text-[#000000]">
                                          New
                                        </span>
                                      )}
                                    </span>
                                    {subitem.externalLink && (
                                      <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                                    )}
                                  </Link>
                                </SidebarMenuButton>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </SidebarMenuItem>

              {/* Templates and other items */}
              {mainNavigationItems
                .filter((item) => !["home", "components"].includes(item.value))
                .map((item) => (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton
                      isActive={
                        currentSection !== "magic" &&
                        !pathname.startsWith("/s/") &&
                        activeTab === item.value
                      }
                      onClick={() =>
                        navigateToTab(
                          item.value as Exclude<AppSection, "magic">,
                        )
                      }
                    >
                      <div className="flex items-center w-full">
                        {getIconForNavItem(item.value)}
                        {item.title}
                        {item.isNew && (
                          <span className="ml-2 rounded-md bg-[#adfa1d] px-1.5 py-0.5 text-xs leading-none text-[#000000]">
                            New
                          </span>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold text-foreground">
            Contest
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/contest"}
                  onClick={() => {
                    router.push("/contest")
                  }}
                >
                  <div className="flex items-center w-full">
                    <Swords className="mr-2 h-4 w-4" />
                    Overview
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/contest/leaderboard"}
                  onClick={() => {
                    router.push("/contest/leaderboard")
                  }}
                >
                  <div className="flex items-center w-full">
                    <Trophy className="mr-2 h-4 w-4" />
                    Leaderboard
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Add You section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold text-foreground">
            You
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    if (userState.profile?.display_username) {
                      router.push(
                        `/${userState.profile.display_username}?tab=bookmarks`,
                      )
                    } else if (clerkUser?.externalAccounts?.[0]?.username) {
                      router.push(
                        `/${clerkUser.externalAccounts[0].username}?tab=bookmarks`,
                      )
                    }
                  }}
                >
                  <div className="flex items-center w-full">
                    <Bookmark className="mr-2 h-4 w-4" />
                    Bookmarks
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    if (userState.profile?.display_username) {
                      router.push(
                        `/${userState.profile.display_username}?tab=purchased_bundles`,
                      )
                    } else if (clerkUser?.externalAccounts?.[0]?.username) {
                      router.push(
                        `/${clerkUser.externalAccounts[0].username}?tab=purchased_bundles`,
                      )
                    }
                  }}
                >
                  <div className="flex items-center w-full">
                    <Package className="mr-2 h-4 w-4" />
                    Purchased Bundles
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold text-foreground">
            Explore
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.map((category: NavigationCategory, index: number) => {
                const categoryId = `category-${index}`
                const isExpanded = expandedCategories.includes(categoryId)

                const getCategoryIcon = () => {
                  if (category.title === "Marketing Blocks") {
                    return <Presentation className="mr-2 h-4 w-4" />
                  }
                  if (category.title === "Collections") {
                    return <FolderKanban className="mr-2 h-4 w-4" />
                  }
                  return <Group className="mr-2 h-4 w-4" />
                }

                return (
                  <SidebarMenuItem
                    key={category.title}
                    className="group/menu-item relative"
                  >
                    <SidebarMenuButton
                      onClick={() => toggleCategory(categoryId)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          {getCategoryIcon()}
                          {category.title}
                          {category.isNew && (
                            <span className="ml-2 rounded-md bg-[#adfa1d] px-1.5 py-0.5 text-xs leading-none text-[#000000]">
                              New
                            </span>
                          )}
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "transform rotate-90",
                          )}
                        />
                      </div>
                    </SidebarMenuButton>

                    <AnimatePresence mode="wait">
                      {isExpanded && (
                        <motion.div
                          key={`category-${categoryId}`}
                          initial={{
                            height: 0,
                            opacity: 0,
                            marginTop: 0,
                            marginBottom: 0,
                          }}
                          animate={{
                            height: "auto",
                            opacity: 1,
                            marginTop: 4,
                            marginBottom: 4,
                          }}
                          exit={{
                            height: 0,
                            opacity: 0,
                            marginTop: 0,
                            marginBottom: 0,
                          }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="overflow-hidden ml-6 w-auto"
                          style={{ paddingBottom: 0 }}
                        >
                          <div className="flex flex-col gap-0.5">
                            {category.items.map(
                              (item: NavigationItem, itemIndex: number) => {
                                const isActive =
                                  pathname === item.href ||
                                  pathname.endsWith(item.title.toLowerCase())

                                // Calculate staggered delay but ensure total animation stays under 300ms
                                const staggerDelay = Math.min(
                                  itemIndex * 0.02,
                                  0.15,
                                )

                                return (
                                  <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{
                                      opacity: 0,
                                      y: -5,
                                    }}
                                    transition={{
                                      duration: 0.15,
                                      delay: staggerDelay,
                                      ease: "easeOut",
                                    }}
                                  >
                                    <div className="mb-0">
                                      <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                      >
                                        <Link
                                          href={item.href}
                                          className={cn(
                                            "flex items-center justify-between w-full",
                                            isActive
                                              ? "bg-accent text-accent-foreground font-medium"
                                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                          )}
                                          target={
                                            item.externalLink
                                              ? "_blank"
                                              : undefined
                                          }
                                          rel={
                                            item.externalLink
                                              ? "noopener noreferrer"
                                              : undefined
                                          }
                                          onMouseEnter={() =>
                                            setHoveredItem(item.title)
                                          }
                                          onMouseLeave={() =>
                                            setHoveredItem(null)
                                          }
                                        >
                                          <span className="flex items-center">
                                            {item.title}
                                            {item.isNew && (
                                              <span className="ml-2 rounded-md bg-[#adfa1d] px-1.5 py-0.5 text-xs leading-none text-[#000000]">
                                                New
                                              </span>
                                            )}
                                          </span>
                                          <span
                                            className={cn(
                                              "text-muted-foreground text-sm flex items-center",
                                              hoveredItem === item.title &&
                                                "text-accent-foreground",
                                            )}
                                          >
                                            {item.externalLink &&
                                              hoveredItem === item.title && (
                                                <ArrowUpRight className="ml-1 h-3.5 w-3.5 transition-opacity" />
                                              )}
                                            {item.demosCount}
                                          </span>
                                        </Link>
                                      </SidebarMenuButton>
                                    </div>
                                  </motion.div>
                                )
                              },
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex justify-end pr-4 border-t">
        <div className="flex items-center justify-between">
          <Help open={helpOpen} onOpenChange={setHelpOpen} />
          <div className="relative h-8 w-8">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-accent"
                  aria-label="Toggle Sidebar"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleSidebar()
                  }}
                >
                  <Icons.sidebar className="h-4 w-4" />
                </Button>
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
      </SidebarFooter>
    </Sidebar>
  )
}
