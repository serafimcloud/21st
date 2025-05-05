import { useState, useCallback } from "react"

/**
 * Hook for managing dialog state in the editor
 */
export function useDialogState() {
  // Dialog state
  const [open, setOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  // Reset dialog state
  const resetState = useCallback(() => {
    setIsProcessing(false)
    setIsPublishing(false)
  }, [])

  // Handle dialog open/close
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen)
      if (!isOpen) resetState()
    },
    [resetState],
  )

  return {
    open,
    isProcessing,
    isPublishing,
    setIsProcessing,
    setIsPublishing,
    handleOpenChange,
    resetState,
  }
}
