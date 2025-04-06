import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useActionRequired } from "./context/editor-state"

interface StyleRequirementsPanelProps {
  className?: string
  activeFile?: string
}

export function StyleRequirementsPanel({
  className,
  activeFile,
}: StyleRequirementsPanelProps) {
  const { getActionDetails, markFileAsResolved } = useActionRequired()

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

  // Helper function to format code examples nicely
  const formatKeyframes = (keyframe: any) => {
    if (!keyframe.frames || keyframe.frames === "undefined") {
      // Provide useful default if frames are undefined
      return `@keyframes ${keyframe.name} {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}`
    }
    return `@keyframes ${keyframe.name} {
${keyframe.frames}
}`
  }

  const formatTailwindExtension = (extensions: Record<string, any>) => {
    // Create a more helpful representation with actual values
    const formattedExtensions = { ...extensions }

    // Add example values for empty objects
    Object.keys(formattedExtensions).forEach((key) => {
      if (
        typeof formattedExtensions[key] === "object" &&
        Object.keys(formattedExtensions[key]).length === 0
      ) {
        // Different examples based on the extension type
        if (key === "colors") {
          formattedExtensions[key] = {
            primary: {
              DEFAULT: "hsl(var(--primary))",
              foreground: "hsl(var(--primary-foreground))",
            },
          }
        } else if (key === "animations") {
          formattedExtensions[key] = {
            appear: "appear 0.2s ease-in-out",
            "appear-zoom": "appear-zoom 0.2s ease-in-out",
          }
        } else if (key === "fontFamily") {
          formattedExtensions[key] = {
            sans: ["var(--font-sans)", "sans-serif"],
          }
        } else if (key === "borderRadius") {
          formattedExtensions[key] = {
            lg: "0.5rem",
            xl: "1rem",
          }
        } else if (key === "boxShadow") {
          formattedExtensions[key] = {
            subtle: "0 1px 2px 0 rgb(0 0 0 / 0.1)",
          }
        } else if (key === "spacing") {
          formattedExtensions[key] = {
            "4.5": "1.125rem",
          }
        }
      }
    })

    return JSON.stringify(formattedExtensions, null, 2)
  }

  const title = isTailwindConfig
    ? "Tailwind Config Extension Required"
    : isGlobalCss
      ? "CSS Extension Required"
      : actionDetails.message ||
        `${actionDetails.reason.replace("_", " ")} Required`

  return (
    <div
      className={cn(
        "flex flex-col border border-border h-full rounded-md",
        className,
      )}
    >
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-2 border-b border-border p-3 bg-muted/40">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <div className="flex flex-col">
            <h2 className="font-medium text-sm text-nowrap">{title}</h2>
            <h3 className="text-xs">AI Suggestion</h3>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="self-start sm:self-auto"
          onClick={handleResolve}
        >
          Mark as resolved
        </Button>
      </div>

      {/* Panel Content */}
      <div className="overflow-auto p-3 flex-1 text-xs">
        {isTailwindConfig && (
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs">
              Add the following to your tailwind.config.js in the theme section:
            </p>

            {actionDetails?.tailwindExtensions &&
            Object.keys(actionDetails.tailwindExtensions).length > 0 ? (
              <pre className="bg-muted p-3 rounded border border-border text-xs font-mono overflow-auto max-h-[calc(100vh-250px)]">
                <code>
                  {`module.exports = {
  // ... other configs
  theme: {
    extend: {
      // ... existing extensions
      ${formatTailwindExtension(actionDetails.tailwindExtensions).slice(1, -1)}
    }
  }
}`}
                </code>
              </pre>
            ) : (
              <p className="text-muted-foreground text-xs">
                Update your Tailwind configuration with additional settings.
              </p>
            )}
          </div>
        )}

        {isGlobalCss && (
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs">
              Add the following to your globals.css file:
            </p>

            {actionDetails?.keyframes && actionDetails.keyframes.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium text-xs mb-1">
                  Keyframe animations:
                </h4>
                <pre className="bg-muted p-3 rounded border border-border text-xs font-mono overflow-auto max-h-[200px]">
                  <code>
                    {actionDetails.keyframes.map(formatKeyframes).join("\n\n")}
                  </code>
                </pre>
              </div>
            )}

            {actionDetails?.cssVariables &&
              actionDetails.cssVariables.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-medium text-xs mb-1">CSS variables:</h4>
                  <pre className="bg-muted p-3 rounded border border-border text-xs font-mono overflow-auto max-h-[200px]">
                    <code>
                      {`:root {
  ${actionDetails.cssVariables
    .map((variable: any) => `${variable.name}: ${variable.value || "#000000"}`)
    .join(";\n  ")};
}`}
                    </code>
                  </pre>
                </div>
              )}

            {actionDetails?.utilities && actionDetails.utilities.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium text-xs mb-1">Utility classes:</h4>
                <pre className="bg-muted p-3 rounded border border-border text-xs font-mono overflow-auto max-h-[200px]">
                  <code>
                    {actionDetails.utilities
                      .map(
                        (utility: any) =>
                          `.${utility.name} {
  ${utility.properties || "/* Add properties here */"}
}`,
                      )
                      .join("\n\n")}
                  </code>
                </pre>
              </div>
            )}

            {!actionDetails?.keyframes?.length &&
              !actionDetails?.cssVariables?.length &&
              !actionDetails?.utilities?.length && (
                <p className="text-muted-foreground text-xs">
                  Update your global CSS file with additional styles for this
                  component.
                </p>
              )}
          </div>
        )}

        {!isTailwindConfig && !isGlobalCss && (
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs">
              {actionDetails.message ||
                "This file requires action to work properly."}
            </p>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-muted-foreground text-xs">
            Add these changes to make the component display correctly
          </p>
        </div>
      </div>
    </div>
  )
}
