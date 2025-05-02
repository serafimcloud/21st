import { Button } from "@/components/ui/button"
import { useParams, usePathname, useRouter } from "next/navigation"
import { publishSandbox, editSandbox } from "../api"
import { useEffect, useState, useRef } from "react"
import {
  RocketIcon,
  Loader2,
  CheckIcon,
  XIcon,
  ArrowLeftIcon,
  ArchiveIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { motion } from "motion/react"
import { Logo } from "@/components/ui/logo"
import { UserAvatar } from "@/components/ui/user-avatar"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PublishHeaderProps {
  sandboxId: string | null
  sandboxName?: string
  username?: string
  onGenerateRegistry?: () => void
  isRegenerating?: boolean
  showPreview?: boolean
  onNameChange?: (newName: string) => void
}

export function PublishHeader({
  sandboxId,
  sandboxName = "Untitled",
  username,
  onGenerateRegistry,
  isRegenerating = false,
  showPreview = true,
  onNameChange,
}: PublishHeaderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(sandboxName)
  const inputRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLHeadingElement>(null)

  const pathname = usePathname()

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

  const [editLoading, setEditLoading] = useState(false)

  const params = useParams()
  const router = useRouter()

  const handlePublish = async () => {
    if (!sandboxId) return
    setIsLoading(true)
    try {
      const { success } = await publishSandbox(sandboxId)
      if (success) {
        toast.success("Sandbox sent to review")
        await router.push(`/studio/${params.username}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

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
    router.push(`/studio/${params.username}`)
  }

  const handleNextStep = () => {
    router.push(`${pathname}/publish`)
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
                src={null}
                alt={username}
                size={24}
                className="mr-1"
              />
              <span className="text-sm font-medium">{username}</span>
              <div className="text-muted-foreground mx-1">/</div>
            </div>
          )}

          <div className="flex items-center gap-2 group relative">
            {isEditing ? (
              <>
                <Input
                  ref={inputRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-sm font-medium bg-transparent border-0 border-b border-primary/50 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-0 h-auto"
                  autoFocus
                  onKeyDown={handleKeyDown}
                  onBlur={handleEditName}
                />
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
                <TooltipProvider>
                  <Tooltip delayDuration={1}>
                    <TooltipTrigger asChild>
                      <h1
                        ref={textRef}
                        className="text-sm font-medium py-0.5 px-0 cursor-text transition-colors hover:bg-accent/30 relative after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[1px] after:bg-black after:opacity-0 hover:after:opacity-100 group-hover:after:opacity-100"
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

                <div className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                  Draft
                </div>
              </>
            )}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={handleNextStep}>Continue</Button>
        </div>
      </div>
    </header>
  )
}
