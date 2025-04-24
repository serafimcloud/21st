import { SandboxSession } from "@codesandbox/sdk"
import { connectToSandbox } from "@codesandbox/sdk/browser"
import { useEffect, useRef, useState } from "react"
import { connectToServerSandbox } from "../api"

export const useSandbox = ({
  defaultSandboxId,
}: {
  defaultSandboxId: string | null
}) => {
  const sandboxRef = useRef<SandboxSession | null>(null)
  const [sandboxId, setSandboxId] = useState<string | null>(defaultSandboxId)
  const [sandboxConnectionHash, setSandboxConnectionHash] = useState<
    string | null
  >(null)
  const [previewURL, setPreviewURL] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const initialize = async () => {
    setIsLoading(true)
    try {
      const { sandboxId: newSandboxId, startData } =
        await connectToServerSandbox(sandboxId)

      const connectedSandbox = await connectToSandbox(startData)
      const newPreviewURL = connectedSandbox.ports.getPreviewUrl(5173)

      setPreviewURL(newPreviewURL || null)
      sandboxRef.current = connectedSandbox
      setSandboxConnectionHash(
        Math.random().toString(36).substring(2) + Date.now().toString(36),
      )
      setSandboxId(newSandboxId)
    } catch (error) {
      console.error("Failed to initialize sandbox in hook:", error)
      sandboxRef.current = null
      setSandboxId(null)
      setSandboxConnectionHash(null)
      setPreviewURL(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    initialize()
  }, [defaultSandboxId])

  const reconnectSandbox = async () => {
    if (!sandboxId) return
    await initialize()
  }

  return {
    sandboxRef,
    sandboxId,
    previewURL,
    isSandboxLoading: isLoading,
    sandboxConnectionHash,
    reconnectSandbox,
  }
}
