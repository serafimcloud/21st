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
  const [shellConnectionHash, setShellConnectionHash] = useState<string>("")
  const [previewURL, setPreviewURL] = useState<string | null>(null)
  const [isSandboxLoading, setIsSandboxLoading] = useState(true)
  const [missingDependencyInfo, setMissingDependencyInfo] = useState<{
    packageName: string
    latestVersion: string
  } | null>(null)

  const initShellSubsciption = async () => {
    if (!sandboxRef.current) {
      return
    }

    // setInterval(async () => {
    //   const shells = await sandboxRef.current?.shells.getShells()

    //   const runningShells = shells?.filter(
    //     (shell) =>
    //       shell.name === "pnpm run install-and-dev" &&
    //       shell.status === "RUNNING",
    //   )

    //   console.log(
    //     "shells",
    //     runningShells?.map((shell) => {
    //       return {
    //         id: shell.id,
    //         name: shell.name,
    //         status: shell.status,
    //       }
    //     }),
    //   )
    // }, 1000 * 5)

    const shells = await sandboxRef.current?.shells.getShells()

    const runningShells = shells?.filter(
      (shell) =>
        shell.name === "pnpm run install-and-dev" && shell.status === "RUNNING",
    )

    if (!runningShells?.length) {
      return
    }

    const openedRunningShells = await Promise.all(
      shells.map(async (shell) => {
        return await sandboxRef.current?.shells.open(shell.id)
      }),
    )

    setShellConnectionHash(
      Math.random().toString(36).substring(2) + Date.now().toString(36),
    )

    openedRunningShells.forEach((shell) => {
      shell!.onOutput(async (data) => {
        console.log("data", data)
        const latestPackageVersion =
          await getLatestPackageVersionFromError(data)
        if (latestPackageVersion) {
          setMissingDependencyInfo(latestPackageVersion)
        }
      })

      // shell!.onWillDispose(() => {
      //   console.log("openedRunningShell disposed")
      //   setTimeout(() => {
      //     initShellSubsciption()
      //   }, 1000 * 10)
      // })
    })
  }

  // PLAN B => with more checks it will work actually
  // useEffect(() => {
  //   setInterval(async () => {
  //     await initShellSubsciption()
  //   }, 1000 * 5)
  // }, [])

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

      await initShellSubsciption()
      setPreviewURL(newPreviewURL || null)
      // setSandboxConnectionHash(
      //   Math.random().toString(36).substring(2) + Date.now().toString(36),
      // )
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
    // dependencies
    missingDependencyInfo,
    clearMissingDependencyInfo,
    // unique hash of a shell connection
    shellConnectionHash,
  }
}
