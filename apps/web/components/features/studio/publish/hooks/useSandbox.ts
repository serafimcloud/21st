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
  const [sandboxId, setSandboxId] = useState<string | null>(defaultSandboxId)
  const [sandboxConnectionHash, setSandboxConnectionHash] = useState<
    string | null
  >(null)
  const [connectedShellId, setConnectedShellId] = useState<string>("")
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

      console.log("startData", startData)
      const connectedSandbox = await connectToSandbox(startData)

      console.log("connectedSandbox", connectedSandbox)
      const newPreviewURL = connectedSandbox.ports.getPreviewUrl(5173)
      sandboxRef.current = connectedSandbox

      setPreviewURL(newPreviewURL || null)
      checkShells()
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

  const subscribedShells = useRef<Set<string>>(new Set())

  const checkShells = async () => {
    if (!sandboxRef.current) {
      return
    }

    const shells = await sandboxRef.current?.shells.getShells()

    console.log("shells", shells)
    const allRunningShells = shells?.filter(
      (shell) =>
        shell.name === "pnpm run install-and-dev" && shell.status === "RUNNING",
    )

    const newRunningShells = allRunningShells?.filter(
      (shell) => !subscribedShells.current.has(shell.id),
    )
    const shellsToShutdown = allRunningShells?.filter((shell) =>
      subscribedShells.current.has(shell.id),
    )

    if (!newRunningShells?.length) {
      return
    }

    const openedRunningShells = await Promise.all(
      newRunningShells.map(async (shell) => {
        return await sandboxRef.current?.shells.open(shell.id)
      }),
    )

    shellsToShutdown.forEach((shell) => {
      shell!.dispose()
    })

    openedRunningShells.forEach((shell) => {
      shell!.onOutput(async (data) => {
        console.log("SHELL", shell!.id, "OUTPUT", data)

        const latestPackageVersion =
          await getLatestPackageVersionFromError(data)
        if (latestPackageVersion) {
          setMissingDependencyInfo(latestPackageVersion)
        }
      })

      subscribedShells.current.add(shell!.id)
      setConnectedShellId(shell!.id)
    })
  }

  // subscribe to shells to read output & remount iframe when new shell is created
  useEffect(() => {
    const interval = setInterval(async () => {
      await checkShells()
    }, 1000 * 5)

    return () => clearInterval(interval)
  }, [])

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
    // dependencies
    missingDependencyInfo,
    clearMissingDependencyInfo,
    // unique hash of a shell connection
    connectedShellId,
  }
}
