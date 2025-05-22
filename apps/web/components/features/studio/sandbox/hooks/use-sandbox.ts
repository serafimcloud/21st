import { Tables } from "@/types/supabase"
import { SandboxSession } from "@codesandbox/sdk"
import { connectToSandbox as connectToCodeSandboxSDK } from "@codesandbox/sdk/browser"
import { useEffect, useRef, useState } from "react"
import { connectToSandbox } from "../api"
import { getLatestPackageVersionFromError } from "../utils/dependencies"

export type ServerSandbox = Pick<
  Tables<"sandboxes">,
  "codesandbox_id" | "name" | "id" | "component_id"
> | null

export type SandboxStatus = "draft" | "edit" | "published" | undefined

export const useSandbox = ({ sandboxId }: { sandboxId: string }) => {
  const sandboxRef = useRef<SandboxSession | null>(null)
  const [sandboxConnectionHash, setSandboxConnectionHash] = useState<
    string | null
  >(null)
  const [serverSandbox, setServerSandbox] = useState<ServerSandbox>(null)
  const [connectedShellId, setConnectedShellId] = useState<string>("")
  const [previewURL, setPreviewURL] = useState<string | null>(null)
  const [isSandboxLoading, setIsSandboxLoading] = useState(true)
  const [sandboxStatus, setSandboxStatus] = useState<SandboxStatus>()
  const [missingDependencyInfo, setMissingDependencyInfo] = useState<{
    packageName: string
    latestVersion: string
  } | null>(null)

  const initialize = async (isReconnecting = false) => {
    if (!isReconnecting) {
      setIsSandboxLoading(true)
    }
    try {
      const response = await connectToSandbox(sandboxId)

      if (!response) {
        // Implement failed logic; redirect to studio page
        throw new Error("Failed to connect to sandbox")
      }

      const { startData, sandbox: serverSandbox } = response

      setServerSandbox(serverSandbox)

      console.log("startData", startData)
      const connectedSandbox = await connectToCodeSandboxSDK(startData)

      console.log("connectedSandbox", connectedSandbox)

      sandboxRef.current = connectedSandbox

      const hash = Math.random().toString(36).substring(2, 15)
      setSandboxConnectionHash(hash)

      checkShells()

      const isPortOpen = await connectedSandbox.ports.waitForPort(5173)
      if (isPortOpen) {
        const newPreviewURL = connectedSandbox.ports.getPreviewUrl(5173)
        console.log("newPreviewURL", newPreviewURL)
        setPreviewURL(newPreviewURL || null)
      }
    } catch (error) {
      console.error("Failed to initialize sandbox in hook:", error)
      sandboxRef.current = null
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
        // console.log("SHELL", shell!.id, "OUTPUT", data)

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

  // Subscribe to shells to read output & remount iframe when new shell is created
  useEffect(() => {
    const interval = setInterval(async () => {
      await checkShells()
    }, 1000 * 5)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    console.log("INITIALIZING sandbox", sandboxId)
    initialize()
  }, [])

  const reconnectSandbox = async () => {
    console.log("RECONNECTING sandbox")
    if (!sandboxId) return
    await initialize(true)
  }

  const clearMissingDependencyInfo = () => {
    setMissingDependencyInfo(null)
  }

  useEffect(() => {
    if (isSandboxLoading || !serverSandbox) {
      setSandboxStatus(undefined)
    } else {
      setSandboxStatus(serverSandbox.component_id ? "edit" : "draft")
    }
  }, [serverSandbox?.component_id, isSandboxLoading])

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
    // sandbox from the server containing metadata
    serverSandbox,
    sandboxStatus,
  }
}
