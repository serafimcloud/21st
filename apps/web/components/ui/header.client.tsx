"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"

import { atom } from "jotai"
import { SignInButton, SignedIn, SignedOut, useClerk } from "@clerk/nextjs"
import { ChevronDown, Bookmark } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NavigationMenuLink } from "@/components/ui/navigation-menu"

import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

import { UserAvatar } from "./user-avatar"
import { Icons } from "@/components/icons"
import { EditProfileDialog } from "@/components/features/profile/edit-profile-dialog"
import { useUserProfile } from "@/components/hooks/use-user-profile"
import { useAnimation } from "motion/react"
import { useAtom } from "jotai"
import { sidebarOpenAtom } from "@/components/features/main-page/main-layout"
import { useTheme } from "next-themes"

export const searchQueryAtom = atom("")

export function Header({
  text,
  variant = "default",
}: {
  text?: string
  variant?: "default" | "publish"
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()
  const { signOut } = useClerk()
  const { user: dbUser, clerkUser: user, isLoading } = useUserProfile()
  const [showEditProfile, setShowEditProfile] = useState(false)
  const searchParams = useSearchParams()
  const step = searchParams.get("step")
  const controls = useAnimation()
  const router = useRouter()
  const [open, setSidebarOpen] = useAtom(sidebarOpenAtom)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault()
        inputRef.current?.focus()
      } else if (event.key === "Escape") {
        inputRef.current?.blur()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const handleBookmarksClick = () => {
    if (dbUser?.display_username) {
      router.push(`/${dbUser.display_username}?tab=bookmarks`)
    } else if (user?.externalAccounts?.[0]?.username) {
      router.push(`/${dbUser?.username}?tab=bookmarks`)
    }
  }

  if (variant === "publish" && step) {
    return null
  }

  return (
    <>
      <header
        className={cn(
          "flex fixed top-0 left-0 right-0 h-14 z-40 items-center px-4 py-3 text-foreground",
          {
            "border-b border-border/40 bg-background": variant !== "publish",
          },
        )}
      >
        <div
          className={cn("flex items-center flex-1", open ? "ml-64 pl-3" : "")}
        >
          <Link
            href="/"
            className="absolute left-4 top-3 h-8 w-8 bg-foreground rounded-full"
          />
          {text && !isMobile && (
            <div className="flex items-center gap-2">
              <Icons.slash className="text-border w-[22px] h-[22px]" />
              <span className="text-[14px] font-medium">{text}</span>
            </div>
          )}

          <div
            className={cn(
              "w-[400px]",
              open ? "ml-4" : "absolute left-1/2 -translate-x-1/2",
            )}
          >
            <Button
              variant="outline"
              className={cn(
                "relative h-8 w-full justify-start bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 hidden md:inline-flex",
              )}
              onClick={() =>
                document.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", metaKey: true }),
                )
              }
            >
              <span className="hidden lg:inline-flex mr-4">
                Global search...
              </span>
              <span className="inline-flex lg:hidden mr-4">Search...</span>
              <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-sans text-[11px] opacity-100 sm:flex">
                <span className="text-[11px] font-sans">⌘</span>K
              </kbd>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <SignedIn>
            {!isMobile && variant !== "publish" && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBookmarksClick}
                  className="mr-2"
                  aria-label="Saved components"
                >
                  <Bookmark size={18} />
                </Button>
                <div className="inline-flex -space-x-px divide-x divide-primary-foreground/30 rounded-lg shadow-sm shadow-black/5 rtl:space-x-reverse">
                  <Button
                    asChild
                    className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
                  >
                    <Link href="/publish">Add new</Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 !border !border-white/75 hover:!border-foreground/90 hover:text-accent"
                        size="icon"
                        aria-label="Component options"
                      >
                        <ChevronDown
                          size={16}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-64"
                      side="bottom"
                      sideOffset={4}
                      align="end"
                    >
                      <DropdownMenuItem asChild>
                        <Link href="/publish" className="cursor-pointer">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">
                              Publish component
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Create and publish a new component to the registry
                            </span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/publish/template"
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">
                              Publish template
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Create and publish a new website template
                            </span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/import" className="cursor-pointer">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium flex items-center gap-1">
                              Import from registry
                              <Badge
                                variant="secondary"
                                className="h-5 text-[11px] tracking-wide font-medium uppercase px-1.5 py-0 leading-none"
                              >
                                beta
                              </Badge>
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Import an existing component from shadcn registry
                            </span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer rounded-full ml-2">
                <UserAvatar
                  src={dbUser?.display_image_url || user?.imageUrl || undefined}
                  alt={dbUser?.display_name || user?.fullName || undefined}
                  size={32}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[240px] p-0" align="end">
                <div className="p-3 border-b border-border">
                  <p className="text-sm text-foreground">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>

                <div className="p-1">
                  <DropdownMenuItem
                    className="text-sm px-3 py-2 cursor-pointer"
                    onSelect={() => {
                      if (dbUser?.display_username) {
                        router.push(`/${dbUser.display_username}`)
                      } else if (user?.externalAccounts?.[0]?.username) {
                        router.push(`/${dbUser?.username}`)
                      }
                    }}
                  >
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm px-3 py-2 cursor-pointer"
                    onSelect={() => setShowEditProfile(true)}
                  >
                    Edit Profile
                  </DropdownMenuItem>
                </div>

                <div className="border-t border-border p-1">
                  <DropdownMenuItem
                    className="text-sm px-3 py-2 cursor-pointer"
                    onSelect={() => (window.location.href = "/api-access")}
                  >
                    API Docs & Keys
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm px-3 py-2 cursor-pointer"
                    onSelect={() => window.open("/terms", "_blank")}
                  >
                    Terms of Service
                  </DropdownMenuItem>
                </div>

                <div className="border-t border-border p-1">
                  <DropdownMenuItem
                    className="text-sm px-3 py-2 cursor-pointer flex justify-between items-center"
                    onSelect={() =>
                      window.open("https://x.com/serafimcloud", "_blank")
                    }
                  >
                    <span>Twitter</span>
                    <div className="flex items-center justify-center w-4">
                      <Icons.twitter className="h-3 w-3" />
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm px-3 py-2 cursor-pointer flex justify-between items-center"
                    onSelect={() =>
                      window.open("https://discord.gg/Qx4rFunHfm", "_blank")
                    }
                  >
                    <span>Discord</span>
                    <Icons.discord className="h-4 w-4" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm px-3 py-2 cursor-pointer flex justify-between items-center"
                    onSelect={() =>
                      window.open(
                        "https://github.com/serafimcloud/21st",
                        "_blank",
                      )
                    }
                  >
                    <span>GitHub</span>
                    <Icons.gitHub className="h-4 w-4" />
                  </DropdownMenuItem>
                </div>

                <div className="border-t border-border p-1">
                  <li className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>Theme</span>
                    <fieldset className="flex items-center rounded-full border border-border/40 bg-background">
                      <legend className="sr-only">
                        Select a display theme:
                      </legend>
                      <span>
                        <input
                          type="radio"
                          id="theme-switch-system"
                          value="system"
                          className="sr-only peer"
                          name="theme"
                          checked={theme === "system"}
                          onChange={() => setTheme("system")}
                        />
                        <label
                          htmlFor="theme-switch-system"
                          className="inline-flex items-center justify-center rounded-full p-1.5 text-sm cursor-pointer text-muted-foreground hover:text-foreground peer-checked:bg-accent peer-checked:text-foreground"
                        >
                          <span className="sr-only">system</span>
                          <Icons.system className="h-4 w-4" />
                        </label>
                      </span>
                      <span>
                        <input
                          type="radio"
                          id="theme-switch-light"
                          value="light"
                          name="theme"
                          className="sr-only peer"
                          checked={theme === "light"}
                          onChange={() => setTheme("light")}
                        />
                        <label
                          htmlFor="theme-switch-light"
                          className="inline-flex items-center justify-center rounded-full p-1.5 text-sm cursor-pointer text-muted-foreground hover:text-foreground peer-checked:bg-accent peer-checked:text-foreground"
                        >
                          <span className="sr-only">light</span>
                          <Icons.lightTheme className="h-4 w-4" />
                        </label>
                      </span>
                      <span>
                        <input
                          type="radio"
                          id="theme-switch-dark"
                          value="dark"
                          name="theme"
                          className="sr-only peer"
                          checked={theme === "dark"}
                          onChange={() => setTheme("dark")}
                        />
                        <label
                          htmlFor="theme-switch-dark"
                          className="inline-flex items-center justify-center rounded-full p-1.5 text-sm cursor-pointer text-muted-foreground hover:text-foreground peer-checked:bg-accent peer-checked:text-foreground"
                        >
                          <span className="sr-only">dark</span>
                          <Icons.darkTheme className="h-4 w-4" />
                        </label>
                      </span>
                    </fieldset>
                  </li>
                  <DropdownMenuItem
                    className="text-sm px-3 py-2 cursor-pointer flex justify-between items-center"
                    onSelect={() => setSidebarOpen((prev) => !prev)}
                  >
                    <span>Toggle Sidebar</span>
                    <div className="flex items-center">
                      <Icons.sidebar className="h-4 w-4" />
                    </div>
                  </DropdownMenuItem>
                </div>

                <div className="border-t border-border p-1">
                  <DropdownMenuItem
                    onSelect={() => signOut({ redirectUrl: "/" })}
                    className="text-sm px-3 py-2 cursor-pointer flex justify-between items-center"
                    onMouseEnter={() => controls.start("hover")}
                    onMouseLeave={() => controls.start("normal")}
                  >
                    <span>Log Out</span>
                    <Icons.logout size={16} controls={controls} />
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </SignedIn>

          <SignedOut>
            <SignInButton>
              <Button className="ml-2">Sign up</Button>
            </SignInButton>
          </SignedOut>
        </div>
      </header>
      {showEditProfile && dbUser && !isLoading && (
        <EditProfileDialog
          isOpen={showEditProfile}
          setIsOpen={setShowEditProfile}
          user={{
            name: user?.fullName || "",
            username: user?.externalAccounts?.[0]?.username || "",
            image_url: user?.imageUrl || "",
            display_name: dbUser.display_name || null,
            display_username: dbUser.display_username || null,
            display_image_url: dbUser.display_image_url || null,
            bio: dbUser.bio || null,
          }}
          onUpdate={() => {
            setShowEditProfile(false)
            window.location.reload()
          }}
        />
      )}
    </>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none text-foreground">
            {title}
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"
