import { Button } from "@/components/ui/button"
import { useParams, usePathname, useRouter } from "next/navigation"
import { publishSandbox, editSandbox } from "../api"
import { useEffect, useState } from "react"
import {
  RocketIcon,
  Loader2,
  PenIcon,
  CheckIcon,
  XIcon,
  ArrowLeftIcon,
  ArchiveIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"

interface PublishHeaderProps {
  sandboxId: string | null
  sandboxName?: string
  username?: string
  onGenerateRegistry?: () => void
  isRegenerating?: boolean
}

export function PublishHeader({
  sandboxId,
  sandboxName = "Untitled",
  onGenerateRegistry,
  isRegenerating = false,
}: PublishHeaderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(sandboxName)

  const pathname = usePathname()

  useEffect(() => {
    setName(sandboxName)
  }, [sandboxName])

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
        toast.success("Sandbox name updated")
        setIsEditing(false)
      }
    } catch (error) {
      toast.error("Failed to update sandbox name")
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

  return (
    <header className="flex flex-col p-4 border-b">
      <div className="flex items-center">
        <Button
          size="icon"
          variant="outline"
          onClick={handleBackToStudio}
          className="mr-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xl font-bold h-9 w-[300px]"
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleEditName}
              disabled={editLoading}
            >
              {editLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCancel}
              disabled={editLoading}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{name}</h1>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8"
            >
              <PenIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={handleNextStep}>Next step</Button>
          <Button
            onClick={onGenerateRegistry}
            disabled={isRegenerating}
            className="gap-2"
          >
            {isRegenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArchiveIcon className="h-4 w-4" />
            )}
            {isRegenerating ? "Generating registry..." : "Generate registry"}
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RocketIcon className="h-4 w-4" />
            )}
            Publish
          </Button>
        </div>
      </div>
      {params.username && (
        <p className="ml-10 text-sm text-muted-foreground mt-1">
          By {params.username}
        </p>
      )}
    </header>
  )
}
