import { Button } from "@/components/ui/button"
import { useParams, usePathname, useRouter } from "next/navigation"
import { publishSandbox, editSandbox } from "../api"
import { useEffect, useState } from "react"
import { RocketIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { SandboxHeader } from "./sandbox-header"

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
  const [name, setName] = useState(sandboxName)
  const [isNavigating, setIsNavigating] = useState(false)

  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    setName(sandboxName)
  }, [sandboxName])

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

  const handleNextStep = () => {
    setIsNavigating(true)
    router.push(`${pathname}/publish`)
  }

  // Update outside components when name changes
  useEffect(() => {
    onNameChange?.(name)
  }, [name, onNameChange])

  return (
    <SandboxHeader
      sandboxId={sandboxId}
      sandboxName={sandboxName}
      username={username}
      status="draft"
      showEditName={true}
      onNameChange={onNameChange}
      customNextLabel="Continue"
      customNextAction={handleNextStep}
      isNextLoading={isNavigating}
    />
  )
}
