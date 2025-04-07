import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useActionRequired, useCodeManager } from "./context/editor-state"

interface RequirementsPanelProps {
  className?: string
  activeFile?: string
}

export function RequirementsPanel({
  className,
  activeFile,
}: RequirementsPanelProps) {
  const { getActionDetails, markFileAsResolved } = useActionRequired()

  // Get code manager
  let codeManager
  try {
    codeManager = useCodeManager()
  } catch (error) {
    codeManager = null
  }

  // If no active file, don't show anything
  if (!activeFile) {
    return null
  }

  // Get the action details for the active file
  const actionDetails = getActionDetails(activeFile)

  // If no action required for this file, don't show anything
  if (!actionDetails) {
    return null
  }

  // Handle resolving the file
  const handleResolve = () => {
    if (activeFile) {
      markFileAsResolved(activeFile)
    }
  }

  // Get file-specific content
  const isTailwindConfig = activeFile === "/tailwind.config.js"
  const isGlobalCss = activeFile === "/globals.css"

  // Prepare message content based on additionalStyles
  const getMessageContent = () => {
    if (isTailwindConfig) {
      const extensionDetails: string[] = []
      const tailwindExtensions = actionDetails?.tailwindExtensions

      if (tailwindExtensions) {
        const extensionTypes = [
          "boxShadow",
          "colors",
          "animations",
          "borderRadius",
          "fontFamily",
          "spacing",
        ] as const

        extensionTypes.forEach((extType) => {
          const extensions = tailwindExtensions[extType]
          if (extensions && Object.keys(extensions).length > 0) {
            const values = Object.keys(extensions).join(", ")
            extensionDetails.push(`${extType}: ${values}`)
          }
        })
      }

      if (extensionDetails.length > 0) {
        return `Add Tailwind extensions: ${extensionDetails.join("; ")}`
      }

      return "Tailwind configuration updates required"
    }

    if (isGlobalCss) {
      const parts = []

      // Show specific CSS variable names
      if (
        actionDetails?.cssVariables &&
        actionDetails.cssVariables.length > 0
      ) {
        const varNames = actionDetails.cssVariables
          .map((v: any) => v.name)
          .join(", ")
        parts.push(`CSS variables: ${varNames}`)
      }

      // Show specific keyframe names
      if (actionDetails?.keyframes && actionDetails.keyframes.length > 0) {
        const keyframeNames = actionDetails.keyframes
          .map((k: any) => k.name)
          .join(", ")
        parts.push(`keyframes: ${keyframeNames}`)
      }

      // Show specific utility class names
      if (actionDetails?.utilities && actionDetails.utilities.length > 0) {
        const classNames = actionDetails.utilities
          .map((u: any) => {
            const className = u.className || u.name
            return className?.startsWith(".") ? className : `.${className}`
          })
          .join(", ")
        parts.push(`utilities: ${classNames}`)
      }

      if (parts.length > 0) {
        return `Add ${parts.join(", ")}`
      }

      return "CSS updates required"
    }

    return actionDetails.message || "This file requires updates"
  }

  const message = getMessageContent()

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-xl w-full",
        className,
      )}
    >
      <div className="flex items-center justify-between p-3 bg-background border border-border rounded-2xl shadow-md">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium">AI Suggestion</span>
            <span className="text-xs">{message}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResolve}
          className="flex items-center gap-1"
        >
          <span>Mark as resolved</span>
        </Button>
      </div>
    </div>
  )
}
