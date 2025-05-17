/* eslint-disable turbo/no-undeclared-env-vars */
"use client"

import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs"
import { atom, useAtom } from "jotai"
import { useTheme } from "next-themes"
import Link from "next/link"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import ShortUUID from "short-uuid"

import { useSupabaseAnalytics } from "@/hooks/use-analytics"
import {
  AMPLITUDE_EVENTS,
  identifyUser,
  trackEvent,
  trackPageProperties,
} from "@/lib/amplitude"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { promptOptions, type PromptOptionBase } from "@/lib/prompts"
import {
  addTagsToDemo,
  useHasUserBookmarkedDemo,
  useUpdateComponentWithTags,
} from "@/lib/queries"
import {
  AnalyticsActivityType,
  Component,
  Demo,
  DemoWithTags,
  PROMPT_TYPES,
  PromptType,
  Submission,
  Tag,
  User,
} from "@/types/global"

import { Icons } from "@/components/icons"
import { BookmarkButton } from "@/components/ui/bookmark-button"
import { Button } from "@/components/ui/button"
import { CopyPromptDialog } from "@/components/ui/copy-prompt-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ComponentPagePreview } from "../../../components/features/component-page/component-preview"
import { usePublishAs } from "../../../components/features/publish/hooks/use-publish-as"
import { EditComponentDialog } from "../../../components/ui/edit-component-dialog"
import { ThemeToggle } from "../../../components/ui/theme-toggle"
import { UserAvatar } from "../../../components/ui/user-avatar"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { isEditingCodeAtom } from "@/components/ui/edit-component-dialog"
import { Logo } from "@/components/ui/logo"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useComponentAccess } from "@/hooks/use-component-access"
import { cn } from "@/lib/utils"
import { addVersionToUrl } from "@/lib/utils/url"
import { atomWithStorage } from "jotai/utils"
import {
  Check,
  ChevronDown,
  CodeXml,
  Flag,
  Info,
  Pencil,
  Plus,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export const isShowCodeAtom = atom(true)
const selectedPromptTypeAtom = atomWithStorage<PromptType>(
  "selectedPromptType",
  PROMPT_TYPES.EXTENDED,
)
export const isFullScreenAtom = atom(false)
const addNoCacheParam = (url: string | null | undefined) => {
  if (!url) return undefined
  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}t=${Date.now()}`
}

const useAnalytics = ({
  component,
  user,
}: {
  component: Component & { user: User }
  user: ReturnType<typeof useUser>["user"]
}) => {
  const { capture } = useSupabaseAnalytics()
  useEffect(() => {
    trackPageProperties({
      componentId: component.id,
      componentName: component.name,
      authorId: component.user.id,
      isPublic: component.is_public,
      tags: [],
      downloadsCount: component.downloads_count,
      hasDemo: !!component.demo_code,
      deviceType: window.innerWidth < 768 ? "mobile" : "desktop",
    })
    capture(component.id, AnalyticsActivityType.COMPONENT_VIEW, user?.id)
  }, [component.id])

  useEffect(() => {
    if (user) {
      identifyUser(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        username: user.username,
        created_at: user.createdAt,
        is_admin: user.publicMetadata?.isAdmin || false,
      })
    }
  }, [user])
}
const useKeyboardShortcuts = ({
  component,
  setIsShowCode,
  canEdit,
  isEditDialogOpen,
  setIsEditDialogOpen,
  handlePromptAction,
}: {
  component: Component & { user: User }
  setIsShowCode: Dispatch<SetStateAction<boolean>>
  canEdit: boolean
  isEditDialogOpen: boolean
  setIsEditDialogOpen: Dispatch<SetStateAction<boolean>>
  handlePromptAction: () => void
}) => {
  const [, setIsFullScreen] = useAtom(isFullScreenAtom)
  const [isEditingCode] = useAtom(isEditingCodeAtom)

  const handleShareClick = async () => {
    if (typeof window === "undefined") return

    const url = `${window.location.origin}/${component.user.username}/${component.component_slug}`
    try {
      if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        trackEvent(AMPLITUDE_EVENTS.SHARE_COMPONENT, {
          componentId: component.id,
          componentName: component.name,
          url,
        })
        toast("Link copied to clipboard")
      }
    } catch (err) {
      console.error("Error copying link: ", err)
    }
  }

  // Toggle code view with [ and ]
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      // Check if we're not in an input/editing mode
      if (
        isEditingCode ||
        (e.target instanceof Element && e.target.matches("input, textarea"))
      ) {
        return
      }

      // Check for modifiers
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
        return
      }

      if (e.code === "BracketRight" || e.code === "BracketLeft") {
        e.preventDefault()
        if (e.code === "BracketRight") {
          setIsShowCode(false)
          trackEvent(AMPLITUDE_EVENTS.TOGGLE_CODE_VIEW, {
            componentId: component.id,
            view: "info",
          })
        } else {
          setIsShowCode(true)
          trackEvent(AMPLITUDE_EVENTS.TOGGLE_CODE_VIEW, {
            componentId: component.id,
            view: "code",
          })
        }
      }
    }

    window.addEventListener("keydown", keyDownHandler)
    return () => window.removeEventListener("keydown", keyDownHandler)
  }, [isEditingCode, component.id, setIsShowCode])

  // Edit component with E
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      // Only if user can edit and dialog not already open
      if (!canEdit || isEditDialogOpen) return

      // Check if we're not in an input
      if (e.target instanceof Element && e.target.matches("input, textarea")) {
        return
      }

      // Check for no modifiers
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
        return
      }

      if (e.code === "KeyE") {
        e.preventDefault()
        setIsEditDialogOpen(true)
      }
    }

    window.addEventListener("keydown", keyDownHandler)
    return () => window.removeEventListener("keydown", keyDownHandler)
  }, [isEditDialogOpen, setIsEditDialogOpen, canEdit])

  // Prompt action with Cmd/Ctrl + X
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      // Only with Cmd/Ctrl modifier
      if (!e.metaKey && !e.ctrlKey) return

      // No other modifiers
      if (e.altKey || e.shiftKey) return

      if (e.code === "KeyX") {
        e.preventDefault()
        handlePromptAction()
      }
    }

    document.addEventListener("keydown", keyDownHandler)
    return () => document.removeEventListener("keydown", keyDownHandler)
  }, [handlePromptAction])

  // Share with Cmd/Ctrl + Shift + C
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      // Must have Cmd/Ctrl + Shift
      if ((!e.metaKey && !e.ctrlKey) || !e.shiftKey) return

      // No alt modifier
      if (e.altKey) return

      if (e.code === "KeyC") {
        e.preventDefault()
        handleShareClick()
      }
    }

    window.addEventListener("keydown", keyDownHandler)
    return () => window.removeEventListener("keydown", keyDownHandler)
  }, [])

  // Toggle fullscreen with F
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      // Check if we're not in an input
      if (e.target instanceof Element && e.target.matches("input, textarea")) {
        return
      }

      // Check for no modifiers
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
        return
      }

      if (e.code === "KeyF") {
        e.preventDefault()
        setIsFullScreen((prev) => !prev)
      }

      // Exit fullscreen with Escape
      if (e.code === "Escape") {
        e.preventDefault()
        setIsFullScreen(false)
      }
    }

    window.addEventListener("keydown", keyDownHandler)
    return () => window.removeEventListener("keydown", keyDownHandler)
  }, [setIsFullScreen])
}

async function purgeCacheForDemo(
  previewUrl: string | null | undefined,
  videoUrl: string | null | undefined,
): Promise<void> {
  const filesToPurge: string[] = []
  if (previewUrl) {
    filesToPurge.push(previewUrl)
  }
  if (videoUrl) {
    filesToPurge.push(videoUrl)
  }

  if (filesToPurge.length === 0) return

  const currentPath = window.location.pathname

  await fetch("/api/purge-cache", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filesToPurge,
      pathToRevalidate: ["/", currentPath],
    }),
  })
}

type ComponentPageProps = {
  component: Component & { user: User } & { tags: Tag[] }
  demo: DemoWithTags
  componentDemos: DemoWithTags[] | null
  code: string
  demoCode: string
  dependencies: Record<string, string>
  demoDependencies: Record<string, string>
  demoComponentNames: string[]
  registryDependencies: Record<string, string>
  npmDependenciesOfRegistryDependencies: Record<string, string>
  tailwindConfig?: string
  globalCss?: string
  compiledCss?: string
  submission?: Submission
  tailwind4IndexCss?: string
  hasPurchased?: boolean
}

export default function ComponentPage({
  component: initialComponent,
  demo: initialDemo,
  code,
  demoCode,
  dependencies = {},
  demoDependencies = {},
  demoComponentNames = [],
  registryDependencies = {},
  npmDependenciesOfRegistryDependencies = {},
  tailwindConfig,
  globalCss,
  compiledCss,
  componentDemos = [],
  submission,
  hasPurchased = false,
  tailwind4IndexCss,
}: ComponentPageProps) {
  const [component, setComponent] = useState(initialComponent)
  const demo = initialDemo ?? null
  const { user } = useUser()
  const supabase = useClerkSupabaseClient()
  const { theme } = useTheme()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { isAdmin } = usePublishAs({ username: user?.username ?? "" })
  const { capture } = useSupabaseAnalytics()
  const canEdit = user?.id === component.user_id || isAdmin
  const router = useRouter()

  const accessState = useComponentAccess(component, hasPurchased)
  const showPaywall = accessState !== "UNLOCKED"

  const { data: bookmarked } = useHasUserBookmarkedDemo(
    supabase,
    demo?.id,
    user?.id,
  )

  const [isShowCode, setIsShowCode] = useAtom(isShowCodeAtom)

  const [selectedPromptType, setSelectedPromptType] = useAtom(
    selectedPromptTypeAtom,
  )

  const { mutate: updateComponent } = useUpdateComponentWithTags(supabase)

  const [isCopyPromptDialogOpen, setIsCopyPromptDialogOpen] = useState(false)

  const handleUpdate = async (
    updatedData: Partial<Component>,
    demoUpdates: Partial<Demo> & { demo_tags?: Tag[] },
  ) => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔄 Starting update process:", {
        componentUpdates: updatedData,
        demoUpdates,
        demoId: demoUpdates.id,
      })
    }

    try {
      if (Object.keys(demoUpdates).length > 0 && demoUpdates.id) {
        if (process.env.NODE_ENV === "development") {
          console.log("📝 Processing demo updates for ID:", demoUpdates.id)
        }

        const { data: currentDemo } = await supabase
          .from("demos")
          .select("preview_url, video_url")
          .eq("id", demoUpdates.id)
          .single()

        if (process.env.NODE_ENV === "development") {
          console.log("📊 Current demo data:", currentDemo)
        }

        if (demoUpdates.preview_url) {
          if (!demoUpdates.preview_url.includes("/preview.")) {
            const baseUrl = currentDemo?.preview_url || demoUpdates.preview_url
            demoUpdates.preview_url = addVersionToUrl(baseUrl)
          }

          if (process.env.NODE_ENV === "development") {
            console.log("🖼️ Processing preview URL:", {
              currentUrl: currentDemo?.preview_url,
              newUrl: demoUpdates.preview_url,
            })
          }
        }

        if (demoUpdates.video_url) {
          if (!demoUpdates.video_url.includes("/video.")) {
            const baseUrl = currentDemo?.video_url || demoUpdates.video_url
            demoUpdates.video_url = addVersionToUrl(baseUrl)
          }

          if (process.env.NODE_ENV === "development") {
            console.log("🎥 Processing video URL:", {
              currentUrl: currentDemo?.video_url,
              newUrl: demoUpdates.video_url,
            })
          }
        }

        if (demoUpdates.preview_url || demoUpdates.video_url) {
          await purgeCacheForDemo(
            addNoCacheParam(demoUpdates.preview_url),
            addNoCacheParam(demoUpdates.video_url),
          )
        }

        if (demoUpdates.demo_tags?.length !== undefined) {
          await supabase
            .from("demo_tags")
            .delete()
            .eq("demo_id", demoUpdates.id)

          const tagsToAdd = demoUpdates.demo_tags.filter(
            (tag) => !!tag.slug,
          ) as Tag[]
          if (tagsToAdd.length > 0) {
            await addTagsToDemo(supabase, demoUpdates.id, tagsToAdd)
          }
        }

        const demoUpdatePayload = {
          preview_url: demoUpdates.preview_url,
          video_url: demoUpdates.video_url,
          updated_at: new Date().toISOString(),
        }

        if (process.env.NODE_ENV === "development") {
          console.log("💾 Updating demo with payload:", demoUpdatePayload)
        }

        const { error: demoError } = await supabase
          .from("demos")
          .update(demoUpdatePayload)
          .eq("id", demoUpdates.id)

        if (demoError) {
          throw new Error(`Failed to update demo: ${demoError.message}`)
        }
      }

      await updateComponent(
        { componentId: component.id, updatedData },
        {
          onSuccess: async () => {
            if (process.env.NODE_ENV === "development") {
              console.log("✅ Component update successful")
            }

            const { data: updatedComponent, error } = await supabase
              .from("components")
              .select(
                `
                *,
                user:users!components_user_id_fkey(*),
                tags:component_tags(tag:tag_id(*))
              `,
              )
              .eq("id", component.id)
              .single()

            if (error) {
              throw new Error(
                `Failed to fetch updated component: ${error.message}`,
              )
            }

            if (updatedComponent) {
              const transformedComponent = {
                ...updatedComponent,
                tags: updatedComponent.tags.map(
                  (tagRelation: any) => tagRelation.tag,
                ),
              }

              setComponent(
                transformedComponent as Component & { user: User } & {
                  tags: Tag[]
                },
              )
              setIsEditDialogOpen(false)
              toast.success("Component updated successfully")
            }
          },
          onError: (error) => {
            console.error("❌ Error updating component:", error)
            toast.error("Failed to update component")
            throw error
          },
        },
      )
    } catch (err) {
      console.error("❌ Update process failed:", err)
      toast.error("Failed to update component")
      throw err
    }
  }

  const handleEditClick = () => {
    setIsEditDialogOpen(true)
    trackEvent(AMPLITUDE_EVENTS.EDIT_COMPONENT, {
      componentId: component.id,
      componentName: component.name,
      userId: user?.id,
      editType: component.sandbox_id ? "sandbox" : "dialog",
      hasSandbox: !!component.sandbox_id,
      shortSandboxId: component.sandbox_id
        ? ShortUUID().fromUUID(component.sandbox_id)
        : undefined,
    })
  }

  const handlePromptAction = async () => {
    // Open dialog for non-v0 prompt types
    setIsCopyPromptDialogOpen(true)
  }

  const handleCopyPrompt = async (ruleId?: number, context?: string) => {
    try {
      // Get the selected rule from the dialog
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt_type: selectedPromptType,
          demo_id: demo.id,
          rule_id: ruleId,
          additional_context: context,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        throw new Error(errorData.error || "Failed to generate prompt")
      }

      const data = await response.json()
      console.log("Response data:", data)

      if (!data.prompt) {
        throw new Error("No prompt received in response")
      }

      await navigator.clipboard.writeText(data.prompt)

      if (data.debug) {
        const debugMessage = []
        if (data.debug.ruleApplied) debugMessage.push("rule applied")
        if (data.debug.contextApplied) debugMessage.push("context added")

        toast.success(`Prompt copied to clipboard`)
      } else {
        toast.success("AI prompt copied to clipboard")
      }

      capture(
        component.id,
        AnalyticsActivityType.COMPONENT_PROMPT_COPY,
        user?.id,
      )

      trackEvent(AMPLITUDE_EVENTS.COPY_AI_PROMPT, {
        componentId: component.id,
        componentName: component.name,
        promptType: selectedPromptType as PromptType,
        action: "copy",
        destination:
          selectedPromptType === PROMPT_TYPES.V0
            ? "v0"
            : selectedPromptType === PROMPT_TYPES.LOVABLE
              ? "lovable"
              : selectedPromptType === PROMPT_TYPES.BOLT
                ? "bolt"
                : "other",
      })
    } catch (error) {
      console.error("Error in handleCopy:", error)
      toast.error(
        error instanceof Error ? error.message : "Error generating prompt",
      )
    }
  }

  const handleReportClick = () => {
    const issueTitle = encodeURIComponent(`Report: ${component.name} component`)
    const issueBody = encodeURIComponent(
      `Component: ${component.name}\nAuthor: ${component.user.username}\nURL: ${window.location.href}\n\nPlease describe the issue:`,
    )
    window.open(
      `https://github.com/serafimcloud/21st/issues/new?title=${issueTitle}&body=${issueBody}`,
      "_blank",
    )
  }

  useAnalytics({
    component,
    user,
  })

  useKeyboardShortcuts({
    component,
    canEdit,
    setIsShowCode,
    isEditDialogOpen,
    setIsEditDialogOpen,
    handlePromptAction,
  })

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg h-[98vh] w-full py-4 bg-background text-foreground`}
    >
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Logo className="w-[22px] h-[22px]" position="flex" />
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="start"
              className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
            >
              <p className="flex items-center gap-1.5">Back to homepage</p>
            </TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-2">
            <Icons.slash className="text-border w-[22px] h-[22px]" />
            <div className="flex items-center gap-2 min-w-0">
              <Link
                href={`/${component.user.display_username || component.user.username}`}
                className="cursor-pointer"
              >
                <UserAvatar
                  src={
                    component.user.display_image_url ||
                    component.user.image_url ||
                    "/placeholder.svg"
                  }
                  alt={
                    component.user.display_name ||
                    component.user.name ||
                    component.user.username ||
                    ""
                  }
                  size={22}
                  isClickable={true}
                  user={component.user}
                  skipLink={true}
                />
              </Link>
              <p className="text-[14px] font-medium whitespace-nowrap">
                {component.name}
              </p>
            </div>
          </div>

          {demo && (
            <div className="hidden md:flex items-center gap-2">
              <Icons.slash className="text-border w-[22px] h-[22px]" />
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
                size={22}
                isClickable={true}
                user={demo.user}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-1 cursor-pointer group px-2 py-1 rounded-md hover:bg-accent">
                    <p className="text-[14px] font-medium whitespace-nowrap">
                      {demo.name}
                    </p>
                    <ChevronDown
                      size={16}
                      className="text-muted-foreground group-hover:text-foreground transition-colors"
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="start"
                  className="w-[300px] p-0"
                >
                  <Command className="flex flex-col">
                    <CommandInput placeholder="Find demo..." />
                    <div className="flex-1 h-[300px] flex flex-col">
                      <CommandList className="flex-1 overflow-y-auto">
                        <CommandEmpty>No demos found.</CommandEmpty>
                        <CommandGroup>
                          {(componentDemos ?? []).map((d) => (
                            <CommandItem
                              key={d.id}
                              value={`${d.id}-${d.demo_slug}`}
                              data-demo-id={d.id}
                              onSelect={() =>
                                router.push(
                                  `/${component.user.display_username || component.user.username}/${component.component_slug}/${d.demo_slug}`,
                                )
                              }
                              className="flex items-center gap-2"
                            >
                              <div className="relative w-[80px] h-[60px] flex-shrink-0">
                                <img
                                  src={d.preview_url || "/placeholder.svg"}
                                  alt={d.name || ""}
                                  className="rounded-sm object-cover absolute inset-0 w-full h-full"
                                />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <p className="font-medium line-clamp-2">
                                  {d.name}
                                </p>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <UserAvatar
                                    src={
                                      d.user.display_image_url ||
                                      d.user.image_url ||
                                      "/placeholder.svg"
                                    }
                                    alt={
                                      d.user.display_name ||
                                      d.user.name ||
                                      d.user.username ||
                                      ""
                                    }
                                    size={16}
                                    isClickable={false}
                                    user={d.user}
                                  />
                                  <span className="truncate">
                                    {d.user.display_username || d.user.username}
                                  </span>
                                </div>
                              </div>
                              {d.id === demo.id && (
                                <Check
                                  size={16}
                                  className="ml-auto flex-shrink-0"
                                />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                      {!component.sandbox_id && (
                        <div className="border-t">
                          <CommandGroup>
                            <CommandItem
                              onSelect={() =>
                                router.push(
                                  `/publish/demo?componentId=${component.id}`,
                                )
                              }
                            >
                              <Plus size={16} className="mr-2" />
                              Add new demo
                            </CommandItem>
                          </CommandGroup>
                        </div>
                      )}
                    </div>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {canEdit && submission && (
            <>
              <Icons.slash className="text-border w-[22px] h-[22px]" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1",
                      submission.status === "on_review" &&
                        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                      submission.status === "featured" &&
                        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                      submission.status === "posted" &&
                        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                    )}
                  >
                    {submission.status === "posted"
                      ? "Not featured"
                      : submission.status
                          .replace("_", " ")
                          .charAt(0)
                          .toUpperCase() +
                        submission.status.replace("_", " ").slice(1)}
                    {submission.status === "featured" && (
                      <Check size={12} className="inline-block" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="py-3">
                  <div className="space-y-2.5">
                    <p className="text-sm font-medium leading-none tracking-tight">
                      Submission Status:{" "}
                      {submission.status === "posted"
                        ? "Not featured"
                        : submission.status
                            .replace("_", " ")
                            .charAt(0)
                            .toUpperCase() +
                          submission.status.replace("_", " ").slice(1)}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {submission.status === "on_review" &&
                        "Your component is being reviewed by our moderators before being made public."}
                      {submission.status === "featured" &&
                        "Your component has been approved and is featured on the platform and homepage."}
                      {submission.status === "posted" &&
                        "Your component has been approved but is not shown on the homepage."}
                    </p>
                    {submission.moderators_feedback &&
                      ["posted", "featured"].includes(submission.status) && (
                        <>
                          <div className="h-px bg-border" />
                          <div className="rounded-lg border bg-muted/50 p-3">
                            <p className="text-sm font-medium mb-1">
                              Moderator Feedback
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {submission.moderators_feedback}
                            </p>
                          </div>
                        </>
                      )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle fillIcon={false} />
          <Tooltip>
            <TooltipTrigger className="hidden md:flex" asChild>
              <button
                onClick={handleReportClick}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-md relative group"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Flag
                    size={16}
                    className="group-hover:text-red-500 transition-colors"
                  />
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
              <p className="flex items-center gap-1.5">Report Component</p>
            </TooltipContent>
          </Tooltip>
          {canEdit && (
            <Tooltip>
              <TooltipTrigger className="hidden md:flex" asChild>
                <button
                  onClick={handleEditClick}
                  className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-md relative"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Pencil size={16} />
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                <p className="flex items-center gap-1.5">
                  Edit Component
                  <kbd className="pointer-events-none text-muted-foreground h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 flex text-[11px] leading-none font-sans">
                    E
                  </kbd>
                </p>
              </TooltipContent>
            </Tooltip>
          )}
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

          <div className="hidden md:flex items-center gap-1">
            <div className="relative bg-muted rounded-lg h-8 p-0.5 flex">
              <div
                className="absolute inset-y-0.5 rounded-md bg-background shadow transition-all duration-200 ease-in-out"
                style={{
                  width: "calc(50% - 2px)",
                  left: isShowCode ? "2px" : "calc(50%)",
                }}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsShowCode(true)}
                    className={`relative z-2 px-2 flex items-center justify-center transition-colors duration-200 ${
                      isShowCode ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <CodeXml size={18} />
                    <span className="text-[14px] pl-1 pr-2">Code</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                  <p className="flex items-center gap-1.5">
                    Component code
                    <kbd className="pointer-events-none text-muted-foreground h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 flex text-[11px] leading-none font-sans">
                      [
                    </kbd>
                  </p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsShowCode(false)}
                    className={`relative z-2 px-2 flex items-center justify-center transition-colors duration-200 ${
                      !isShowCode ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <Info size={18} />
                    <span className="pl-1 pr-2 text-[14px]">Info</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                  <p className="flex items-center gap-1.5">
                    Component info
                    <kbd className="pointer-events-none h-5 text-muted-foreground select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 flex text-[11px] leading-none font-sans">
                      ]
                    </kbd>
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="inline-flex -space-x-px divide-x divide-primary-foreground/30 rounded-lg shadow-sm">
              <Button
                onClick={!showPaywall ? handlePromptAction : undefined}
                className="shadow-none focus-visible:z-10"
                disabled={showPaywall}
                variant={showPaywall ? "secondary" : "default"}
              >
                {showPaywall ? (
                  "Unlock to copy prompt"
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-[22px] h-[22px]">
                      {
                        promptOptions.find(
                          (opt): opt is PromptOptionBase =>
                            opt.type === "option" &&
                            opt.id === selectedPromptType,
                        )?.icon
                      }
                    </div>
                    <span>Copy prompt</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full !flex-grow">
        <ComponentPagePreview
          key={theme}
          component={component}
          tailwind4IndexCss={tailwind4IndexCss}
          code={code}
          demoCode={demoCode}
          dependencies={dependencies}
          demoDependencies={demoDependencies}
          demoComponentNames={demoComponentNames}
          registryDependencies={registryDependencies}
          npmDependenciesOfRegistryDependencies={
            npmDependenciesOfRegistryDependencies
          }
          tailwindConfig={tailwindConfig}
          globalCss={globalCss}
          compiledCss={compiledCss ?? undefined}
          canEdit={canEdit}
          setIsEditDialogOpen={setIsEditDialogOpen}
          demo={demo}
          showPaywall={showPaywall}
          accessState={accessState}
        />
      </div>
      <EditComponentDialog
        component={component}
        demo={demo}
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        onUpdate={handleUpdate}
      />
      <CopyPromptDialog
        isOpen={isCopyPromptDialogOpen}
        onClose={() => setIsCopyPromptDialogOpen(false)}
        selectedPromptType={selectedPromptType}
        onPromptTypeChange={setSelectedPromptType}
        onCopyPrompt={handleCopyPrompt}
        demoId={demo.id.toString()}
      />
    </div>
  )
}
