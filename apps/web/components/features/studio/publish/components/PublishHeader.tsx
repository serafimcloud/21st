import { Button } from "@/components/ui/button"
import { useParams, useRouter } from "next/navigation"
import { publishSandbox } from "../api"
import { useState } from "react"
import { RocketIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface PublishHeaderProps {
  sandboxId: string | null
  onReset: () => void
}

export function PublishHeader({ sandboxId, onReset }: PublishHeaderProps) {
  const [isLoading, setIsLoading] = useState(false)

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
  return (
    <header className="flex items-center gap-2 p-4 border-b">
      <h1 className="text-2xl font-bold">Publish Your Sandbox</h1>
      {sandboxId && (
        <span className="text-xs text-muted-foreground ml-2">{sandboxId}</span>
      )}
      <div className="ml-auto flex items-center gap-2">
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
    </header>
  )
}
