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
      // Find specific extensions with values
      const extensionDetails: string[] = []

      if (actionDetails?.tailwindExtensions) {
        // Check for boxShadow extensions
        if (
          actionDetails.tailwindExtensions.boxShadow &&
          Object.keys(actionDetails.tailwindExtensions.boxShadow).length > 0
        ) {
          const shadows = Object.keys(
            actionDetails.tailwindExtensions.boxShadow,
          ).join(", ")
          extensionDetails.push(`shadows: ${shadows}`)
        }

        // Check for color extensions
        if (
          actionDetails.tailwindExtensions.colors &&
          Object.keys(actionDetails.tailwindExtensions.colors).length > 0
        ) {
          const colors = Object.keys(
            actionDetails.tailwindExtensions.colors,
          ).join(", ")
          extensionDetails.push(`colors: ${colors}`)
        }

        // Check for animation extensions
        if (
          actionDetails.tailwindExtensions.animations &&
          Object.keys(actionDetails.tailwindExtensions.animations).length > 0
        ) {
          const animations = Object.keys(
            actionDetails.tailwindExtensions.animations,
          ).join(", ")
          extensionDetails.push(`animations: ${animations}`)
        }

        // Check for other extensions
        ;["borderRadius", "fontFamily", "spacing"].forEach((extType) => {
          if (
            actionDetails?.tailwindExtensions?.[
              extType as keyof typeof actionDetails.tailwindExtensions
            ] &&
            Object.keys(
              actionDetails.tailwindExtensions[
                extType as keyof typeof actionDetails.tailwindExtensions
              ] || {},
            ).length > 0
          ) {
            const values = Object.keys(
              actionDetails.tailwindExtensions[
                extType as keyof typeof actionDetails.tailwindExtensions
              ] || {},
            ).join(", ")
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
