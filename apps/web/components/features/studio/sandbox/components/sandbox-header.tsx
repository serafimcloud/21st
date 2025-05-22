import { Spinner } from "@/components/icons/spinner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/ui/logo"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { UserAvatar } from "@/components/ui/user-avatar"
import { useUser } from "@clerk/nextjs"
import {
  ArrowLeftIcon,
  BugIcon,
  CheckIcon,
  Loader2,
  Video,
  XIcon,
} from "lucide-react"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { editSandbox } from "../api"
import { SandboxStatus } from "../hooks/use-sandbox"

interface SandboxHeaderProps {
  sandboxId: string | null | undefined
  sandboxName?: string
  username?: string
  status: SandboxStatus
  showEditName?: boolean
  onNameChange?: (newName: string) => void
  customBackUrl?: string
  customBackLabel?: string
  customBackAction?: () => void
  customNextUrl?: string
  customNextLabel?: string
  customNextIcon?: React.ReactNode
  customNextAction?: () => void
  hideNext?: boolean
  isNextLoading?: boolean
  isBackLoading?: boolean
  showBetaBadge?: boolean
}

export function SandboxHeader({
  sandboxId,
  sandboxName = "...",
  username,
  status,
  showEditName = true,
  onNameChange,
  customBackUrl,
  customBackLabel,
  customBackAction,
  customNextUrl,
  customNextLabel = "Continue",
  customNextIcon,
  customNextAction,
  hideNext = false,
  isNextLoading = false,
  isBackLoading = false,
  showBetaBadge = true,
}: SandboxHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(sandboxName)
  const [editLoading, setEditLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLHeadingElement>(null)

  const { user } = useUser()

  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()

  // Update local state when prop changes
  useEffect(() => {
    setName(sandboxName)
  }, [sandboxName])

  // Set input width to match text width when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current && textRef.current) {
      // Get the computed style to calculate exact width
      const styles = window.getComputedStyle(textRef.current)
      const width = textRef.current.getBoundingClientRect().width

      // Add a small buffer to ensure text isn't cut off
      inputRef.current.style.width = `${width + 8}px`

      // Set min-width to avoid too narrow inputs
      inputRef.current.style.minWidth = "120px"

      // Focus after width is set
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleEditName = async () => {
    if (!sandboxId || name === sandboxName) {
      setIsEditing(false)
      return
    }

    setEditLoading(true)
    try {
      const { success } = await editSandbox(sandboxId, { name })
      if (success) {
        toast.success("Component name updated")
        setIsEditing(false)
        onNameChange?.(name)
      }
    } catch (error) {
      toast.error("Failed to update component name")
      setName(sandboxName)
    } finally {
      setEditLoading(false)
    }
  }

  const handleCancel = () => {
    setName(sandboxName)
    setIsEditing(false)
  }

  const handleBackToStudio = () => {
    if (customBackAction) {
      customBackAction()
    } else if (customBackUrl) {
      router.push(customBackUrl)
    } else {
      router.push(`/studio/${params.username}`)
    }
  }

  const handleNextStep = () => {
    if (customNextAction) {
      customNextAction()
    } else if (customNextUrl) {
      router.push(customNextUrl)
    } else {
      router.push(`${pathname}/publish`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEditName()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  // Update outside components when name changes
  useEffect(() => {
    onNameChange?.(name)
  }, [name, onNameChange])

  const getStatusBadge = () => {
    switch (status) {
      case "edit":
        return (
          <div className="text-xs bg-yellow-500 text-primary-foreground rounded-full px-2 py-0.5">
            Edit
          </div>
        )
      case "published":
        return (
          <div className="text-xs bg-emerald-500 text-primary-foreground rounded-full px-2 py-0.5">
            Published
          </div>
        )
      case "draft":
        return (
          <div className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
            Draft
          </div>
        )
      default:
        return (
          <div className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
            Loading...
          </div>
        )
    }
  }

  return (
    <header className="flex flex-col px-4 py-2 border-b">
      <div className="flex items-center">
        <div className="flex items-center gap-2">
          <div onClick={handleBackToStudio} className="cursor-pointer">
            <Logo position="flex" className="w-6 h-6" hasLink={false} />
          </div>

          <div className="text-muted-foreground">/</div>

          {username && (
            <div className="flex items-center gap-1">
              <UserAvatar
                alt=" "
                src={user?.imageUrl}
                size={24}
                className="mr-1"
              />
              <span className="text-sm font-medium">{username}</span>
              <div className="text-muted-foreground mx-1">/</div>
            </div>
          )}

          <div className="flex items-center gap-2 group relative">
            {isEditing && showEditName ? (
              <>
                <div className="relative">
                  <Input
                    ref={inputRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-sm font-medium bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-0 h-auto shadow-none  "
                    autoFocus
                    onKeyDown={handleKeyDown}
                    onBlur={handleEditName}
                  />
                  <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-black opacity-100 -mb-[2px]"></div>
                </div>
                <div className="flex absolute right-0 top-1/2 -translate-y-1/2 opacity-70 -mr-16">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleEditName}
                    disabled={editLoading}
                    className="h-7 w-7"
                  >
                    {editLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckIcon className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={editLoading}
                    className="h-7 w-7"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                {showEditName ? (
                  <TooltipProvider>
                    <Tooltip delayDuration={1}>
                      <TooltipTrigger asChild>
                        <h1
                          ref={textRef}
                          className="text-sm font-medium py-0.5 px-0 cursor-text transition-colors relative after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[1px] after:bg-black after:opacity-0 hover:after:opacity-100 group-hover:after:opacity-100"
                          onClick={() => setIsEditing(true)}
                        >
                          {name}
                        </h1>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Rename component</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <h1 className="text-sm font-medium py-0.5 px-0">{name}</h1>
                )}

                {getStatusBadge()}
              </>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          {showBetaBadge && (
            <div className="flex flex-row rounded-md overflow-hidden border border-blue-200 dark:border-blue-800 shadow-sm max-w-[400px]">
              <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950 px-2.5 py-2">
                <a
                  href="https://www.loom.com/share/790ed2081db5476f84355e06dec878c4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300 hover:underline transition-colors"
                >
                  <Video className="h-4 w-4" aria-hidden="true" />
                  Watch Tutorial
                </a>
              </div>
              <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-white dark:bg-gray-900">
                <a
                  href="https://discord.gg/Qx4rFunHfm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
                >
                  <BugIcon className="h-4 w-4" aria-hidden="true" />
                  Report Issue
                </a>
              </div>
            </div>
          )}

          {customBackLabel && (
            <Button
              variant="outline"
              onClick={handleBackToStudio}
              className="gap-1"
              disabled={isBackLoading}
            >
              {isBackLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner size={16} color="currentColor" />
                  {customBackLabel}
                </div>
              ) : (
                <>
                  <ArrowLeftIcon className="h-4 w-4" />
                  {customBackLabel}
                </>
              )}
            </Button>
          )}
          {!hideNext && (
            <Button
              onClick={handleNextStep}
              disabled={isNextLoading}
              className="relative transition-all duration-200"
            >
              <div className="flex items-center justify-center gap-2">
                {isNextLoading && <Spinner size={16} color="white" />}
                {customNextLabel}
                {customNextIcon && !isNextLoading && customNextIcon}
              </div>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
