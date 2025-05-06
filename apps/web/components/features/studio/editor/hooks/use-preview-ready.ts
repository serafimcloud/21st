import { useAtom } from "jotai"
import { useCallback } from "react"
import { previewReadyAtom } from "../context/editor-atoms"

/**
 * Hook to manage preview readiness state that doesn't depend on Sandpack
 */
export function usePreviewReady() {
  const [previewReady, setPreviewReady] = useAtom(previewReadyAtom)

  const markPreviewReady = useCallback(() => {
    setPreviewReady(true)
  }, [setPreviewReady])

  const markPreviewNotReady = useCallback(() => {
    setPreviewReady(false)
  }, [setPreviewReady])

  return {
    previewReady,
    markPreviewReady,
    markPreviewNotReady,
  }
}
