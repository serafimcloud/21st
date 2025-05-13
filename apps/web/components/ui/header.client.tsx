"use client"

import React, { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { NavigationMenuLink } from "@/components/ui/navigation-menu"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { atom } from "jotai"
import {
  SignInButton,
  SignedIn,
  SignedOut,
  useClerk,
  useUser,
} from "@clerk/nextjs"
import { ChevronDown, Bookmark } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { UserAvatar } from "./user-avatar"
import { Icons } from "@/components/icons"
import { EditProfileDialog } from "@/components/features/profile/edit-profile-dialog"
import { useAnimation } from "motion/react"
import { useAtom } from "jotai"
import { sidebarOpenAtom } from "@/components/features/main-page/main-layout"
import { useTheme } from "next-themes"
import { useAuth } from "@clerk/nextjs"
import { userStateAtom } from "@/lib/store/user-store"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useQuery } from "@tanstack/react-query"
import {
  trackAttribution,
  ATTRIBUTION_SOURCE,
  SOURCE_DETAIL,
} from "@/lib/attribution-tracking"
import { Logo } from "./logo"

interface UserProfile {
  id: string
  display_name: string | null
  display_username: string | null
  display_image_url: string | null
  bio: string | null
  username: string | null
  created_at: string
  email: string
  github_url: string | null
  image_url: string | null
  twitter_url: string | null
  website_url: string | null
  is_admin: boolean
  is_partner: boolean | null
  manually_added: boolean
  name: string | null
  paypal_email: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  total_components: number
  total_downloads: number
  pro_banner_url: string | null
  pro_referral_url: string | null
  ref: string | null
  role:
    | "designer"
    | "frontend_developer"
    | "backend_developer"
    | "product_manager"
    | "entrepreneur"
    | null
  updated_at: string
  bundles_fee: number
  stripe_id: string
}

interface UserUsage {
  limit: number
  usage: number
  balance: number
}

interface UserStateResponse {
  profile: UserProfile
  usage: UserUsage
}

export const searchQueryAtom = atom("")

function HeaderContent({
  text,
  variant = "default",
  shouldRender,
}: {
  text?: string
  variant?: "default" | "publish"
  shouldRender: boolean
}) {
  if (!shouldRender) return null

  const inputRef = React.useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()
  const { signOut } = useClerk()
  const [showEditProfile, setShowEditProfile] = useState(false)
  const controls = useAnimation()
  const router = useRouter()
  const [open, setSidebarOpen] = useAtom(sidebarOpenAtom)
  const { theme, setTheme } = useTheme()
  const { userId } = useAuth()
  const { user: clerkUser } = useUser()
  const [userState, setUserState] = useAtom(userStateAtom)
  const client = useClerkSupabaseClient()

  // Fetch combined user state using React Query
  const { data: userData, isLoading: isUserDataLoading } =
    useQuery<UserStateResponse | null>({
      queryKey: ["user", userId, "state"],
      queryFn: async () => {
        if (!userId) return null
        const { data, error } = await client.rpc("get_user_state", {
          user_id_param: userId,
        })
        if (error) {
          console.error("Error fetching user state:", error)
          return null
        }
        return data as unknown as UserStateResponse
      },
      enabled: !!userId,
      staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchInterval: 5 * 60 * 1000,
    })

  // Fetch subscription using React Query
  const { data: subscription, isLoading: isSubscriptionLoading } = useQuery({
    queryKey: ["user", userId, "subscription"],
    queryFn: async () => {
      const response = await fetch("/api/stripe/get-subscription")
      if (!response.ok) {
        throw new Error("Failed to fetch subscription")
      }
      return response.json()
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchInterval: 5 * 60 * 1000,
  })

  // Update global state when data changes
  useEffect(() => {
    if (userData) {
      setUserState((prev) => ({
        ...prev,
        profile: userData.profile,
        isProfileLoading: isUserDataLoading,
        subscription: subscription || null,
        isSubscriptionLoading,
        clerkUser: clerkUser || null,
        balance: userData.usage?.balance || null,
        isBalanceLoading: isUserDataLoading,
        lastFetched: Date.now(),
      }))
    }
  }, [
    userData,
    isUserDataLoading,
    subscription,
    isSubscriptionLoading,
    clerkUser,
    setUserState,
  ])

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
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleBookmarksClick = () => {
    if (userState.profile?.display_username) {
      router.push(`/${userState.profile.display_username}?tab=bookmarks`)
    } else if (clerkUser?.externalAccounts?.[0]?.username) {
      router.push(`/${userState.profile?.username}?tab=bookmarks`)
    }
  }

  const handleRedirectToStudio = () => {
    if (userState.profile?.display_username) {
      router.push(`/studio/${userState.profile.display_username}?new=true`)
    } else if (userState.profile?.username) {
      router.push(`/studio/${userState.profile.username}?new=true`)
    } else {
      router.push("/studio?new=true")
    }
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
          className={cn(
            "flex items-center flex-1",
            open ? "md:ml-64 md:pl-3" : "",
          )}
        >
          <Logo />
          {text && !isMobile && (
            <div className="flex items-center gap-2">
              <Icons.slash className="text-border w-[22px] h-[22px]" />
              <span className="text-[14px] font-medium">{text}</span>
            </div>
          )}

          <div
            className={cn(
              "hidden md:block w-[400px]",
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
            <div className="flex items-center">
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
                  {!open &&
                    !userState.isSubscriptionLoading &&
                    !userState.subscription && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="gap-1.5 relative cursor-pointer space-x-2 font-regular ease-out duration-200 outline-0 focus-visible:outline-4 focus-visible:outline-offset-1 hover:bg-transparent"
                      >
                        <Link
                          href="/pricing"
                          onClick={() =>
                            trackAttribution(
                              ATTRIBUTION_SOURCE.HEADER,
                              SOURCE_DETAIL.HEADER_GET_PRO_LINK,
                            )
                          }
                          className="bg-gradient-to-r from-[hsl(var(--primary-gradient-start))] to-[hsl(var(--primary-gradient-end))] bg-clip-text text-transparent"
                        >
                          <span className="font-medium">Get Pro</span>
                        </Link>
                      </Button>
                    )}
                  <div className="inline-flex -space-x-px divide-x divide-primary-foreground/30 rounded-lg shadow-sm shadow-black/5 rtl:space-x-reverse">
                    <Button
                      onClick={handleRedirectToStudio}
                      className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
                    >
                      Add new
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 !border !border-[hsl(var(--primary-gradient-start))] hover:!border-[hsl(var(--primary-gradient-start))] hover:opacity-90 hover:text-accent"
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
                        <DropdownMenuItem
                          onClick={handleRedirectToStudio}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">
                              Publish component
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Create and publish a new component to the registry
                            </span>
                          </div>
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
                                Import an existing component from shadcn
                                registry
                              </span>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() =>
                document.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", metaKey: true }),
                )
              }
              aria-label="Search"
            >
              <Icons.search className="h-6 w-6" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer rounded-full ml-2">
                <UserAvatar
                  src={
                    userState.profile?.display_image_url ||
                    clerkUser?.imageUrl ||
                    undefined
                  }
                  alt={
                    userState.profile?.display_name ||
                    clerkUser?.fullName ||
                    undefined
                  }
                  size={32}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[240px] p-0" align="end">
                <div className="p-3 border-b border-border">
                  <p className="text-sm text-foreground">
                    {clerkUser?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>

                <div className="p-1">
                  <DropdownMenuItem
                    className="text-sm px-3 py-2 cursor-pointer"
                    onSelect={() => {
                      if (userState.profile?.display_username) {
                        router.push(`/${userState.profile.display_username}`)
                      } else if (clerkUser?.externalAccounts?.[0]?.username) {
                        router.push(`/${userState.profile?.username}`)
                      }
                    }}
                  >
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm px-3 py-2 cursor-pointer flex items-center justify-between"
                    onSelect={() => {
                      if (userState.profile?.display_username) {
                        router.push(
                          `/studio/${userState.profile.display_username}`,
                        )
                      } else if (userState.profile?.username) {
                        router.push(`/studio/${userState.profile.username}`)
                      } else {
                        router.push("/studio")
                      }
                    }}
                  >
                    Creator Studio
                    <Icons.layoutDashboard className="h-4 w-4" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm px-3 py-2 cursor-pointer flex items-center justify-between"
                    onSelect={() => router.push("/settings/profile")}
                  >
                    Settings
                    <Icons.settings className="h-4 w-4" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm px-3 py-2 cursor-pointer flex items-center justify-between"
                    onSelect={() =>
                      (window.location.href = "/settings/billing")
                    }
                  >
                    Billing
                    <Icons.creditCard className="h-4 w-4" />
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
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="gap-1.5 relative cursor-pointer space-x-2 font-regular ease-out duration-200 outline-0 focus-visible:outline-4 focus-visible:outline-offset-1 hover:bg-transparent"
              >
                <Link
                  href="/pricing"
                  onClick={() =>
                    trackAttribution(
                      ATTRIBUTION_SOURCE.HEADER,
                      SOURCE_DETAIL.HEADER_GET_PRO_LINK,
                    )
                  }
                >
                  <TextShimmer
                    className="font-medium [--base-color:hsl(var(--primary-gradient-start))] [--base-gradient-color:hsl(var(--primary-gradient-end))] dark:[--base-color:hsl(var(--primary-gradient-start))] dark:[--base-gradient-color:hsl(var(--primary-gradient-end))]"
                    duration={1.2}
                    spread={2}
                  >
                    Get Pro
                  </TextShimmer>
                </Link>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() =>
                document.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", metaKey: true }),
                )
              }
              aria-label="Search"
            >
              <Icons.search className="h-6 w-6" />
            </Button>
            {!isMobile && (
              <SignInButton>
                <Button>Sign up</Button>
              </SignInButton>
            )}
          </SignedOut>
        </div>
      </header>
      {showEditProfile && userState.profile && (
        <EditProfileDialog
          isOpen={showEditProfile}
          setIsOpen={setShowEditProfile}
          user={{
            name: clerkUser?.fullName || "",
            username: clerkUser?.externalAccounts?.[0]?.username || "",
            image_url: clerkUser?.imageUrl || "",
            display_name: userState.profile.display_name || null,
            display_username: userState.profile.display_username || null,
            display_image_url: userState.profile.display_image_url || null,
            bio: userState.profile.bio || null,
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

function HeaderWithParams({
  text,
  variant = "default",
}: {
  text?: string
  variant?: "default" | "publish"
}) {
  const searchParams = useSearchParams()
  const step = searchParams.get("step")

  const shouldRender = !(variant === "publish" && step)

  return (
    <HeaderContent text={text} variant={variant} shouldRender={shouldRender} />
  )
}

export function Header({
  text,
  variant = "default",
}: {
  text?: string
  variant?: "default" | "publish"
}) {
  return (
    <Suspense fallback={null}>
      <HeaderWithParams text={text} variant={variant} />
    </Suspense>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { title: string }
>(({ className, title, children, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          href={href || "#"}
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
        </Link>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"
