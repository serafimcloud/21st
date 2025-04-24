import { SandboxSession } from "@codesandbox/sdk"
import { connectToSandbox } from "@codesandbox/sdk/browser"
import { useEffect, useRef, useState } from "react"
import { connectToServerSandbox } from "../api"
import { getLatestPackageVersionFromError } from "../utils/dependencies"

export const useSandbox = ({
  defaultSandboxId,
}: {
  defaultSandboxId: string | null
}) => {
  const sandboxRef = useRef<SandboxSession | null>(null)
  const shellRef = useRef(null)
  const [sandboxId, setSandboxId] = useState<string | null>(defaultSandboxId)
  const [sandboxConnectionHash, setSandboxConnectionHash] = useState<
    string | null
  >(null)
  const [previewURL, setPreviewURL] = useState<string | null>(null)
  const [isSandboxLoading, setIsSandboxLoading] = useState(true)
  const [missingDependencyInfo, setMissingDependencyInfo] = useState<{
    packageName: string
    latestVersion: string
  } | null>(null)

  const initialize = async (isReconnecting = false) => {
    if (!isReconnecting) {
      setIsSandboxLoading(true)
    }
    try {
      const { sandboxId: newSandboxId, startData } =
        await connectToServerSandbox(sandboxId)

      const connectedSandbox = await connectToSandbox(startData)
      const newPreviewURL = connectedSandbox.ports.getPreviewUrl(5173)
      sandboxRef.current = connectedSandbox

      const shells = await connectedSandbox.shells.getShells()
      // console.log("ALL SHELS", shells.map((s) => s.name))

      shells.forEach((shell) => {
        console.log(shell.name, "shell output", shell.status)
      })

      const runningShell = shells.find(
        (shell) =>
          shell.name === "pnpm run install-and-dev" &&
          shell.status === "RUNNING",
      )

      const openedRunningShell = await connectedSandbox.shells.open(
        runningShell!.id,
      )

      openedRunningShell.onOutput(async (data) => {
        console.log("data", data)
        const latestPackageVersion =
          await getLatestPackageVersionFromError(data)
        if (latestPackageVersion) {
          setMissingDependencyInfo(latestPackageVersion)
        }
      })

      console.log("openedRunningShell", openedRunningShell)

      console.log("runningShell", runningShell)

      // setInterval(() => {
      //   const newPreviewURL = sandboxRef.current?.ports.getPreviewUrl(5173)
      //   console.log("newPreviewURL", newPreviewURL)
      //   setPreviewURL(newPreviewURL || null)
      // }, 1000 * 5)

      setPreviewURL(newPreviewURL || null)

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
      if (!isReconnecting) {
        setIsSandboxLoading(false)
      }
    }
  }

  useEffect(() => {
    initialize()
  }, [defaultSandboxId])

  const reconnectSandbox = async () => {
    if (!sandboxId) return
    await initialize(true)
  }

  const clearMissingDependencyInfo = () => {
    setMissingDependencyInfo(null)
  }

  return {
    sandboxRef,
    sandboxId,
    previewURL,
    isSandboxLoading,
    sandboxConnectionHash,
    reconnectSandbox,
    missingDependencyInfo,
    clearMissingDependencyInfo,
  }
}
