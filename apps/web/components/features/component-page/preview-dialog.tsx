"use client"

import { Icons } from "@/components/icons"
import { Spinner } from "@/components/icons/spinner"
import { BookmarkButton } from "@/components/ui/bookmark-button"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { UserAvatar } from "@/components/ui/user-avatar"
import { useSupabaseAnalytics } from "@/hooks/use-analytics"
import { useComponentAccess } from "@/hooks/use-component-access"
import { useIsMobile } from "@/hooks/use-media-query"
import {
  AMPLITUDE_EVENTS,
  trackEvent,
  trackPageProperties,
} from "@/lib/amplitude"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useHasUserBookmarkedDemo } from "@/lib/queries"
import { cn } from "@/lib/utils"
import {
  AnalyticsActivityType,
  DemoWithComponent,
  PROMPT_TYPES,
  PromptType,
} from "@/types/global"
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs"
import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import {
  ArrowLeft,
  Copy,
  Lock,
  Maximize,
  Minimize,
  Moon,
  MoreVertical,
  Share2,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { PayWall } from "./pay-wall"

const selectedPromptTypeAtom = atomWithStorage<PromptType>(
  "previewDialogSelectedPromptType",
  PROMPT_TYPES.EXTENDED,
)

export function PreviewSkeleton() {
  return (
    <div className="flex-1 animate-pulse bg-muted flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}

export function ComponentPreviewDialog({
  isOpen,
  onClose,
  demo,
  hasPurchased = false,
}: {
  isOpen: boolean
  onClose: () => void
  demo: DemoWithComponent
  hasPurchased?: boolean
}) {
  const { resolvedTheme } = useTheme()
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light")
  const [isLoading, setIsLoading] = useState(true)
  const [isPromptLoading, setIsPromptLoading] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const accessState = useComponentAccess(demo.component, hasPurchased)

  // Close unlock dialog when component becomes unlocked
  useEffect(() => {
    if (accessState === "UNLOCKED") {
      setShowUnlockDialog(false)
    }
  }, [accessState])

  // Add effect to sync preview theme with system theme
  useEffect(() => {
    if (resolvedTheme) {
      setPreviewTheme(resolvedTheme === "dark" ? "dark" : "light")
    }
  }, [resolvedTheme])

  const { user } = useUser()
  const supabase = useClerkSupabaseClient()
  const { capture } = useSupabaseAnalytics()
  const [selectedPromptType, setSelectedPromptType] = useAtom(
    selectedPromptTypeAtom,
  )
  const isMobile = useIsMobile()
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Add analytics tracking
  useEffect(() => {
    if (!isOpen) return // Only track when dialog is open

    trackPageProperties({
      componentId: demo.component.id,
      componentName: demo.component.name,
      authorId: demo.component.user_id,
      isPublic: demo.component.is_public,
      tags: [],
      downloadsCount: demo.component.downloads_count,
      hasDemo: !!demo.component.demo_code,
      deviceType: window.innerWidth < 768 ? "mobile" : "desktop",
    })
    capture(demo.component.id, AnalyticsActivityType.COMPONENT_VIEW, user?.id)
  }, [
    isOpen,
    demo.component.id,
    demo.component.name,
    demo.component.user_id,
    demo.component.is_public,
    demo.component.downloads_count,
    demo.component.demo_code,
    user?.id,
    capture,
  ])

  const bundleUrl = demo.bundle_html_url || demo.bundle_url?.html

  const { data: bookmarked } = useHasUserBookmarkedDemo(
    supabase,
    demo?.id,
    user?.id,
  )
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts if dialog is open
      if (!isOpen) return

      // Check if target is an input/textarea element
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return
      }

      // Check for 'F' keypress for fullscreen
      if (e.code === "KeyF" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault()
        setIsFullscreen((prev) => !prev)
      }

      // Add CMD + X handler for copying prompts
      if (e.code === "KeyX" && e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        handlePromptAction()
      }

      // Handle Enter key for opening component page
      if (e.code === "Enter" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault()
        handleOpenComponentPage()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isOpen])

  if (!bundleUrl) {
    return null
  }

  const handlePromptAction = async () => {
    if (accessState !== "UNLOCKED") {
      setShowUnlockDialog(true)
      return
    }

    // Set loading state before API call
    setIsPromptLoading(true)

    try {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt_type: selectedPromptType,
          demo_id: demo.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate prompt")
      }

      const { prompt } = await response.json()

      // Use the more reliable clipboard copy approach
      const copyToClipboard = (text: string) => {
        // Try the modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard
            .writeText(text)
            .then(() => {
              toast.success("Prompt copied to clipboard")
            })
            .catch((err) => {
              console.error("Clipboard API failed:", err)
              // Fall back to the textarea method
              fallbackCopyTextToClipboard(text)
            })
        } else {
          // Use fallback for non-secure contexts or older browsers
          fallbackCopyTextToClipboard(text)
        }
      }

      // Fallback method using textarea and document.execCommand
      const fallbackCopyTextToClipboard = (text: string) => {
        // Create a temporary textarea element
        const textarea = document.createElement("textarea")
        textarea.value = text

        // Make the textarea out of viewport but fully visible to ensure it works
        textarea.style.position = "fixed"
        textarea.style.left = "0"
        textarea.style.top = "0"
        textarea.style.width = "2em"
        textarea.style.height = "2em"
        textarea.style.padding = "0"
        textarea.style.border = "none"
        textarea.style.outline = "none"
        textarea.style.boxShadow = "none"
        textarea.style.background = "transparent"

        document.body.appendChild(textarea)

        try {
          // Focus and select the text
          textarea.focus()
          textarea.select()

          // Execute copy command
          const successful = document.execCommand("copy")

          if (successful) {
            toast.success("Prompt copied to clipboard")
          } else {
            console.error("execCommand failed")
            toast.error("Failed to copy prompt - please copy manually")

            // If we can't copy automatically, show the text for manual copying
            textarea.style.width = "80%"
            textarea.style.height = "200px"
            textarea.style.background = "white"
            textarea.style.color = "black"
            textarea.style.zIndex = "10000"
            textarea.style.padding = "10px"
            textarea.style.top = "100px"
            toast.info("You can manually copy the text from the text box")

            // Let user know we've made the text visible
            setTimeout(() => {
              document.body.removeChild(textarea)
            }, 10000)
            return
          }
        } catch (err) {
          console.error("Failed to copy text: ", err)
          toast.error("Failed to copy prompt")
        } finally {
          // Clean up if we didn't leave it visible
          if (textarea.parentNode) {
            document.body.removeChild(textarea)
          }
        }
      }

      try {
        copyToClipboard(prompt)

        if (capture) {
          capture(
            demo.component.id,
            AnalyticsActivityType.COMPONENT_PROMPT_COPY,
            user?.id,
          )
        }

        trackEvent(AMPLITUDE_EVENTS.COPY_AI_PROMPT, {
          componentId: demo.component.id,
          componentName: demo.component.name,
          promptType: selectedPromptType as PromptType,
          action: "copy",
        })
      } catch (error) {
        console.error("Error in copy process:", error)
        toast.error("Failed to copy prompt")
      }
    } catch (error) {
      console.error("Error copying prompt:", error)
      toast.error("Failed to copy prompt")
    } finally {
      // Reset loading state when done
      setIsPromptLoading(false)
    }
  }

  const handleOpenComponentPage = () => {
    setIsOpening(true)
    const componentUrl = `/${demo.component.user.display_username || demo.component.user.username}/${demo.component.component_slug}/${demo.demo_slug || "default"}`
    window.location.href = componentUrl
  }

  const handleShare = async () => {
    const componentUrl = `${window.location.origin}/${demo.user.display_username || demo.user.username}/${demo.component.component_slug}/${demo.demo_slug || "default"}`
    await navigator.clipboard.writeText(componentUrl)
    toast.success("Link copied to clipboard")
  }

  const toggleTheme = () => {
    setPreviewTheme((current) => (current === "dark" ? "light" : "dark"))
  }

  const renderDesktopActions = () => (
    <>
      <div className="inline-flex -space-x-px divide-x divide-primary-foreground/30 rounded-lg">
        <Button
          onClick={handlePromptAction}
          variant="ghost"
          className={cn(
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70",
          )}
          disabled={isPromptLoading}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                {accessState !== "UNLOCKED" ? (
                  <>
                    <Lock size={16} />
                    <span>Unlock</span>
                  </>
                ) : isPromptLoading ? (
                  <>
                    <Spinner size={16} />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copy prompt</span>
                  </>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent className="flex items-center gap-1.5">
              {accessState !== "UNLOCKED"
                ? "Unlock component"
                : isPromptLoading
                  ? "Generating prompt..."
                  : "Copy prompt"}
              <kbd className="pointer-events-none h-5 text-muted-foreground select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 flex text-[11px] leading-none font-sans">
                ⌘X
              </kbd>
            </TooltipContent>
          </Tooltip>
        </Button>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8"
          >
            {previewTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle theme</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="h-8 w-8"
          >
            <Share2 size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Share component</TooltipContent>
      </Tooltip>

      <SignedIn>
        <BookmarkButton
          demoId={demo.id}
          bookmarksCount={demo.bookmarks_count || 0}
          size={18}
          showTooltip={true}
          bookmarked={bookmarked ?? false}
        />
      </SignedIn>
      <SignedOut>
        <SignInButton>
          <BookmarkButton
            demoId={demo.id}
            bookmarksCount={demo.bookmarks_count || 0}
            size={18}
            bookmarked={false}
          />
        </SignInButton>
      </SignedOut>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="h-8 w-8"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="flex items-center gap-1.5">
          Toggle fullscreen
          <kbd className="pointer-events-none h-5 text-muted-foreground select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 flex text-[11px] leading-none font-sans">
            F
          </kbd>
        </TooltipContent>
      </Tooltip>

      <Button
        onClick={handleOpenComponentPage}
        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70"
        autoFocus
        disabled={isOpening}
      >
        {isOpening ? (
          <div className="flex items-center gap-2">
            <Spinner size={16} color="#ffffff" />
            <span>Opening...</span>
          </div>
        ) : (
          <>
            <span>Open component</span>
            <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-kbd leading-none opacity-100 flex">
              <Icons.enter className="h-2.5 w-2.5" />
            </kbd>
          </>
        )}
      </Button>
    </>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "flex flex-col p-0 gap-0 overflow-hidden bg-background transition-all duration-200",
          isMobile
            ? "w-screen h-screen max-w-none m-0"
            : isFullscreen
              ? "w-screen h-screen max-w-none m-0"
              : "w-[90vw] h-[90vh] max-w-[1200px]",
        )}
        hideCloseButton
      >
        {!isMobile && (
          <DialogHeader className="h-14 flex flex-row items-center justify-between border-b text-sm pl-4 pr-2.5 space-y-0 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0 text-left">
              <UserAvatar
                src={
                  demo.user.display_image_url ||
                  demo.user.image_url ||
                  "/placeholder.svg"
                }
                alt={
                  demo.user.display_name ||
                  demo.user.name ||
                  demo.user.username ||
                  ""
                }
                size={24}
                isClickable={true}
                user={demo.user}
                className="flex-shrink-0"
              />
              <div className="flex flex-col min-w-0 overflow-hidden">
                <DialogTitle className="text-md font-medium flex gap-1 items-center truncate">
                  <span className="truncate">{demo.component.name}</span>
                  {demo.name != "Default" && (
                    <>
                      <Icons.slash className="text-border w-[12px] h-[12px] flex-shrink-0" />
                      <span className="truncate">{demo.name}</span>
                    </>
                  )}
                </DialogTitle>
                <Link
                  href={`/${demo.user.display_username || demo.user.username}`}
                  className="text-xs text-muted-foreground hover:underline truncate"
                >
                  {demo.user.display_name ||
                    demo.user.name ||
                    demo.user.username}
                </Link>
              </div>
            </div>

            <div className="flex items-center h-full gap-2">
              {renderDesktopActions()}
            </div>
          </DialogHeader>
        )}

        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{
            minHeight: 0,
            width: "100%",
          }}
        >
          {bundleUrl && (
            <>
              {isLoading && <PreviewSkeleton />}
              <iframe
                src={`${bundleUrl}?theme=${previewTheme}${
                  previewTheme === "dark" ? "&dark=true" : ""
                }`}
                className={cn("w-full h-full border-0", isLoading && "hidden")}
                style={{
                  flex: 1,
                  minHeight: 0,
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setIsLoading(false)}
              />
            </>
          )}
        </div>

        {isMobile && (
          <div
            className="flex flex-row items-center justify-between border-t text-sm px-4 space-y-0 flex-shrink-0"
            style={{
              paddingBottom:
                "calc(0.5rem + var(--safe-area-bottom, env(safe-area-inset-bottom, 0px)))",
              paddingTop: "0.5rem",
              height:
                "calc(3.5rem + var(--safe-area-bottom, env(safe-area-inset-bottom, 0px)))",
            }}
          >
            <div className="flex items-center gap-3 min-w-0 max-w-[70%] overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 flex-shrink-0"
              >
                <ArrowLeft size={16} />
              </Button>
              <UserAvatar
                src={
                  demo.user.display_image_url ||
                  demo.user.image_url ||
                  "/placeholder.svg"
                }
                alt={
                  demo.user.display_name ||
                  demo.user.name ||
                  demo.user.username ||
                  ""
                }
                size={24}
                isClickable={true}
                user={demo.user}
                className="flex-shrink-0"
              />
              <div className="flex flex-col min-w-0 overflow-hidden">
                <DialogTitle className="text-md font-medium flex gap-1 items-center truncate">
                  <span className="truncate">{demo.component.name}</span>
                  {demo.name != "Default" && (
                    <>
                      <Icons.slash className="text-border w-[12px] h-[12px] flex-shrink-0" />
                      <span className="truncate">{demo.name}</span>
                    </>
                  )}
                </DialogTitle>
                <Link
                  href={`/${demo.user.display_username || demo.user.username}`}
                  className="text-xs text-muted-foreground hover:underline truncate"
                >
                  {demo.user.display_name ||
                    demo.user.name ||
                    demo.user.username}
                </Link>
              </div>
            </div>

            <div className="flex items-center h-full gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {accessState !== "UNLOCKED" ? (
                    <DropdownMenuItem onClick={handlePromptAction}>
                      <div className="flex items-center gap-2">
                        <Lock size={16} />
                        <span>Unlock</span>
                      </div>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={handlePromptAction}>
                      "Copy prompt"
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={toggleTheme}>
                    Toggle theme
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    Share component
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOpenComponentPage}>
                    {isOpening ? (
                      <div className="flex items-center gap-2">
                        <Spinner size={16} color="#ffffff" />
                        <span>Opening...</span>
                      </div>
                    ) : (
                      "Open component page"
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </DialogContent>

      {showUnlockDialog && (
        <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
          <DialogContent className="w-fit">
            <PayWall accessState={accessState} component={demo.component} />
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}
