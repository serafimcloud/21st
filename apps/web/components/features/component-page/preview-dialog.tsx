"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useUser } from "@clerk/nextjs"
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"
import {
  X,
  Maximize,
  Minimize,
  Copy,
  ChevronDown,
  Sun,
  Moon,
  ArrowUpRight,
  MoreVertical,
  Lock,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/ui/user-avatar"
import { BookmarkButton } from "@/components/ui/bookmark-button"
import { Icons } from "@/components/icons"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useHasUserBookmarkedDemo } from "@/lib/queries"
import { DemoWithComponent } from "@/types/global"
import { cn } from "@/lib/utils"
import { PROMPT_TYPES, PromptType } from "@/types/global"
import { promptOptions } from "@/lib/prompts"
import { AMPLITUDE_EVENTS, trackEvent } from "@/lib/amplitude"
import { useSupabaseAnalytics } from "@/hooks/use-analytics"
import { AnalyticsActivityType } from "@/types/global"
import { toast } from "sonner"
import { atomWithStorage } from "jotai/utils"
import { useAtom } from "jotai"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useIsMobile } from "@/hooks/use-media-query"
import { PayWall } from "./pay-wall"
import { useComponentAccess } from "@/hooks/use-component-access"

const selectedPromptTypeAtom = atomWithStorage<PromptType | "v0-open">(
  "previewDialogSelectedPromptType",
  PROMPT_TYPES.EXTENDED,
)

export function PreviewSkeleton() {
  return <div className="flex-1 animate-pulse bg-muted"></div>
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

  const bundleUrl = demo.bundle_url?.html

  const { data: bookmarked } = useHasUserBookmarkedDemo(
    supabase,
    demo?.id,
    user?.id,
  )

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
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
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  if (!bundleUrl) {
    return null
  }

  const handlePromptAction = async () => {
    if (demo.component.is_paid && accessState !== "UNLOCKED") {
      setShowUnlockDialog(true)
      return
    }

    if (selectedPromptType === "v0-open") {
      const formattedPrompt = encodeURIComponent(demo.component.name)
      window.open(`https://v0.dev/?q=${formattedPrompt}`, "_blank")

      trackEvent(AMPLITUDE_EVENTS.COPY_AI_PROMPT, {
        componentId: demo.component.id,
        componentName: demo.component.name,
        promptType: selectedPromptType,
        action: "open",
        destination: "v0.dev",
      })

      if (capture) {
        capture(
          demo.component.id,
          AnalyticsActivityType.COMPONENT_PROMPT_COPY,
          user?.id,
        )
      }

      return
    }

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
      await navigator.clipboard.writeText(prompt)
      toast.success("Prompt copied to clipboard")

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
      console.error("Error copying prompt:", error)
      toast.error("Failed to copy prompt")
    }
  }

  const handleOpenComponentPage = () => {
    const componentUrl = `/${demo.user.display_username || demo.user.username}/${demo.component.component_slug}/${demo.demo_slug || "default"}`
    window.location.href = componentUrl
  }

  const toggleTheme = () => {
    setPreviewTheme((current) => (current === "dark" ? "light" : "dark"))
  }

  const renderDesktopActions = () => (
    <>
      <div className="inline-flex -space-x-px divide-x divide-primary-foreground/30 rounded-lg shadow-sm">
        <Button
          onClick={handlePromptAction}
          className={cn(
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70",
            // Only add rounded-none if not a single unlock button
            !(demo.component.is_paid && accessState !== "UNLOCKED") && "first:rounded-s-lg rounded-none"
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                {demo.component.is_paid && accessState !== "UNLOCKED" ? (
                  <>
                    <Lock size={16} />
                    <span>Unlock</span>
                  </>
                ) : selectedPromptType === "v0-open" ? (
                  <>
                    <span className="mr-2">Open in</span>
                    <div className="flex items-center justify-center w-[18px] h-[18px]">
                      <Icons.v0Logo className="min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px]" />
                    </div>
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
              {demo.component.is_paid && accessState !== "UNLOCKED"
                ? "Unlock component"
                : selectedPromptType === "v0-open"
                  ? "Open in v0"
                  : "Copy prompt"}
              <kbd className="pointer-events-none h-5 text-muted-foreground select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 flex text-[11px] leading-none font-sans">
                ⌘X
              </kbd>
            </TooltipContent>
          </Tooltip>
        </Button>
        {accessState === "UNLOCKED" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="rounded-none shadow-none last:rounded-e-lg focus-visible:z-10"
                size="icon"
                variant="default"
              >
                <ChevronDown size={16} strokeWidth={2} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64"
              side="bottom"
              sideOffset={4}
              align="end"
            >
              <DropdownMenuRadioGroup
                value={selectedPromptType}
                onValueChange={(value) =>
                  setSelectedPromptType(value as PromptType | "v0-open")
                }
              >
                {(() => {
                  const options = []

                  const copyOption = promptOptions.find(
                    (opt) =>
                      opt.type === "option" && opt.id === PROMPT_TYPES.EXTENDED,
                  )
                  if (copyOption)
                    options.push({
                      ...copyOption,
                      label: "Copy prompt",
                    })

                  const v0Option = promptOptions.find(
                    (opt) => opt.id === "v0-open",
                  )
                  if (v0Option) options.push(v0Option)

                  return options.map((option) => {
                    if (option.type === "separator") return null
                    return (
                      <DropdownMenuRadioItem
                        key={option.id}
                        value={option.id}
                        className="items-start [&>span]:pt-1"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-[22px] h-[22px]">
                            {option.icon}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">
                              {option.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </div>
                        </div>
                      </DropdownMenuRadioItem>
                    )
                  })
                })()}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <SignedIn>
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
        <BookmarkButton
          demoId={demo.id}
          bookmarksCount={demo.bookmarks_count || 0}
          size={18}
          showTooltip={true}
          bookmarked={bookmarked ?? false}
        />
      </SignedIn>
      <SignedOut>
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

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenComponentPage}
            className="h-8 w-8"
          >
            <ArrowUpRight size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Open component page</TooltipContent>
      </Tooltip>
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
            />
            <div className="flex flex-col min-w-0">
              <DialogTitle className="text-md font-medium flex gap-1 items-center">
                {demo.component.name}
                {demo.name != "Default" && (
                  <>
                    <Icons.slash className="text-border w-[12px] h-[12px]" />
                    {demo.name}
                  </>
                )}
              </DialogTitle>
              <Link
                href={`/${demo.user.display_username || demo.user.username}`}
                className="text-xs text-muted-foreground hover:underline truncate"
              >
                {demo.user.display_name || demo.user.name || demo.user.username}
              </Link>
            </div>
          </div>

          <div className="flex items-center h-full gap-2">
            {isMobile ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!demo.component.is_paid && (
                      <DropdownMenuItem onClick={handlePromptAction}>
                        {selectedPromptType === "v0-open"
                          ? "Open in v0"
                          : "Copy prompt"}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={toggleTheme}>
                      Toggle theme
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleOpenComponentPage}>
                      Open component page
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X size={16} />
                </Button>
              </>
            ) : (
              renderDesktopActions()
            )}
          </div>
        </DialogHeader>

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
                src={
                  previewTheme === "dark" ? `${bundleUrl}?dark=true` : bundleUrl
                }
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
      </DialogContent>

      {showUnlockDialog && (
        <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
          <DialogContent>
            <PayWall accessState={accessState} component={demo.component} />
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}
