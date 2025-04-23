import { SandboxSession } from "@codesandbox/sdk"
import { connectToSandbox } from "@codesandbox/sdk/browser"
import { useEffect, useState } from "react"
import { connectToServerSandbox } from "../api"

export const useSandbox = ({
  defaultSandboxId,
}: {
  defaultSandboxId: string | null
}) => {
  const [sandbox, setSandbox] = useState<SandboxSession | null>(null)
  const [sandboxId, setSandboxId] = useState<string | null>(defaultSandboxId)
  const [previewURL, setPreviewURL] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      try {
        const { sandboxId: newSandboxId, startData } =
          await connectToServerSandbox(defaultSandboxId)

        const connectedSandbox = await connectToSandbox(startData)
        const newPreviewURL = connectedSandbox.ports.getPreviewUrl(5173)

        setPreviewURL(newPreviewURL || null)
        setSandbox(connectedSandbox)
        setSandboxId(newSandboxId)
      } catch (error) {
        console.error("Failed to initialize sandbox in hook:", error)
        setSandbox(null)
        setSandboxId(null)
        setPreviewURL(null)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [defaultSandboxId])

  return { sandbox, sandboxId, previewURL, isLoading }
}
