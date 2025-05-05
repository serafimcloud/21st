import { useAtom } from "jotai"
import { useCallback } from "react"
import {
  actionRequiredFilesAtom,
  actionRequiredPathsAtom,
} from "../context/editor-atoms"
import { ActionRequiredDetails } from "../context/editor-types"
import { normalizePath } from "@/lib/utils"

/**
 * Hook with improved logic for tracking files that require action
 */
export function useActionRequired() {
  const [actionRequiredFiles, setActionRequiredFiles] = useAtom(
    actionRequiredFilesAtom,
  )
  const [actionRequiredPaths, setActionRequiredPaths] = useAtom(
    actionRequiredPathsAtom,
  )

  const markFileAsRequiringAction = useCallback(
    (path: string, details: ActionRequiredDetails) => {
      const normalizedPath = normalizePath(path)

      setActionRequiredFiles((prev) => {
        // Skip update if nothing is changing
        if (
          prev[normalizedPath] &&
          JSON.stringify(prev[normalizedPath]) === JSON.stringify(details)
        ) {
          return prev
        }

        const next = { ...prev, [normalizedPath]: details }
        return next
      })

      setActionRequiredPaths((prev) => {
        if (!prev.includes(normalizedPath)) {
          return [...prev, normalizedPath]
        }
        return prev
      })
    },
    [setActionRequiredFiles, setActionRequiredPaths],
  )

  const markFileAsResolved = useCallback(
    (path: string) => {
      const normalizedPath = normalizePath(path)

      setActionRequiredFiles((prev) => {
        if (!prev[normalizedPath]) {
          return prev
        }

        const next = { ...prev }
        delete next[normalizedPath]
        return next
      })

      setActionRequiredPaths((prev) => prev.filter((p) => p !== normalizedPath))
    },
    [setActionRequiredFiles, setActionRequiredPaths],
  )

  const isActionRequired = useCallback(
    (path: string) => {
      const normalizedPath = normalizePath(path)
      return actionRequiredPaths.includes(normalizedPath)
    },
    [actionRequiredPaths],
  )

  const getActionDetails = useCallback(
    (path: string) => {
      const normalizedPath = normalizePath(path)
      return actionRequiredFiles[normalizedPath]
    },
    [actionRequiredFiles],
  )

  return {
    actionRequiredFiles,
    actionRequiredPaths,
    markFileAsRequiringAction,
    markFileAsResolved,
    isActionRequired,
    getActionDetails,
  }
}
