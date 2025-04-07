import { useState, useCallback } from "react"
import { toast } from "sonner"
import { ActivePreview } from "./use-file-management"

interface UseComponentProcessingProps {
  userId: string
  setIsProcessing: (isProcessing: boolean) => void
  setLoadingShadcnComponents: (components: string[]) => void
  setActionRequiredFiles: (files: string[]) => void
  handlePreviewSelect: (
    preview: ActivePreview,
    files: Record<string, any>,
  ) => void
  loadDependencies: (processedData: any) => Promise<{
    remainingComponents: any[]
    updatedLoadingPaths: string[]
    allDependencySlugs: string[]
  }>
  resolveDependencies: (
    dependencySlugs: string[],
    loadingPaths: string[],
  ) => Promise<boolean | undefined>
}

/**
 * Hook for component processing logic
 */
export function useComponentProcessing({
  userId,
  setIsProcessing,
  setLoadingShadcnComponents,
  setActionRequiredFiles,
  handlePreviewSelect,
  loadDependencies,
  resolveDependencies,
}: UseComponentProcessingProps) {
  const [processedData, setProcessedData] = useState<any>(null)

  // Get component file path
  const getComponentFilePath = useCallback(() => {
    if (!processedData) return "/components/ui/component.tsx"

    const registryType = processedData.registryType || "ui"
    const fileName = processedData.slug
      ? `${processedData.slug}.tsx`
      : "component.tsx"
    return `/components/${registryType}/${fileName}`
  }, [processedData])

  // Process component
  const handleProcessComponent = useCallback(
    async (componentCode: string) => {
      if (!componentCode.trim()) {
        toast.error("Please enter component code")
        return
      }

      setIsProcessing(true)
      setLoadingShadcnComponents([]) // Reset loading state at the start
      setActionRequiredFiles([]) // Reset action required files

      // Save the original component code for later use (prevent it from being cleared)
      const originalComponentCode = componentCode

      try {
        const response = await fetch("/api/studio/preprocess-component", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: componentCode, userId }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to process component")
        }

        const data = await response.json()
        console.log("Preprocess component response:", data)

        // Check if the API indicates that style updates are needed
        const styleUpdateFiles: string[] = []

        // Check the additionalStyles property to determine if styles are needed
        if (data.additionalStyles && data.additionalStyles.required) {
          // Ensure the additionalStyles structure is correctly initialized
          if (!data.additionalStyles.tailwindExtensions) {
            data.additionalStyles.tailwindExtensions = {}
          }

          // Initialize all tailwind extension categories
          const extensions = [
            "colors",
            "animations",
            "fontFamily",
            "borderRadius",
            "boxShadow",
            "spacing",
          ]
          extensions.forEach((ext) => {
            if (!data.additionalStyles.tailwindExtensions[ext]) {
              data.additionalStyles.tailwindExtensions[ext] = {}
            }
          })

          if (!data.additionalStyles.cssVariables) {
            data.additionalStyles.cssVariables = []
          }

          if (!data.additionalStyles.keyframes) {
            data.additionalStyles.keyframes = []
          }

          if (!data.additionalStyles.utilities) {
            data.additionalStyles.utilities = []
          }

          // Check for Tailwind extensions
          if (
            data.additionalStyles.tailwindExtensions &&
            Object.entries(data.additionalStyles.tailwindExtensions).some(
              ([_, val]: [string, any]) => Object.keys(val || {}).length > 0,
            )
          ) {
            styleUpdateFiles.push("/tailwind.config.js")
          }

          // Check for CSS variables, keyframes or utilities
          const hasGlobalCssUpdates =
            (data.additionalStyles.cssVariables &&
              data.additionalStyles.cssVariables.length > 0) ||
            (data.additionalStyles.keyframes &&
              data.additionalStyles.keyframes.length > 0) ||
            (data.additionalStyles.utilities &&
              data.additionalStyles.utilities.length > 0)

          if (hasGlobalCssUpdates) {
            styleUpdateFiles.push("/globals.css")
          }

          // If additionalStyles is required but no specific files were marked,
          // default to highlighting both files if there are any non-empty style requirements
          const hasActualStyleChanges =
            // Check if there are actual tailwind extensions needed
            Object.entries(data.additionalStyles.tailwindExtensions || {}).some(
              ([_, val]: [string, any]) => Object.keys(val || {}).length > 0,
            ) ||
            // Check if there are CSS variables
            (data.additionalStyles.cssVariables || []).length > 0 ||
            // Check if there are keyframes
            (data.additionalStyles.keyframes || []).length > 0 ||
            // Check if there are utilities
            (data.additionalStyles.utilities || []).length > 0

          if (styleUpdateFiles.length === 0 && hasActualStyleChanges) {
            styleUpdateFiles.push("/tailwind.config.js", "/globals.css")
          } else if (styleUpdateFiles.length === 0 && !hasActualStyleChanges) {
            // If required is true but there's nothing actually to add, this is a false positive
            // so we should set it to false
            data.additionalStyles.required = false
          }

          // Fix any undefined values in keyframes or utilities
          if (data.additionalStyles.keyframes) {
            data.additionalStyles.keyframes =
              data.additionalStyles.keyframes.map((keyframe: any) => {
                // Standardize keyframe structure - ensure we always use 'name' and 'frames'
                const name = keyframe.name || keyframe.keyframeName || ""
                const frames = keyframe.frames || keyframe.definition || ""

                if (!frames || frames === "undefined") {
                  // Provide a default example keyframe definition
                  return {
                    name,
                    frames:
                      "0% { opacity: 0; transform: scale(0.95); }\n100% { opacity: 1; transform: scale(1); }",
                  }
                }
                return { name, frames }
              })
          }

          if (data.additionalStyles.utilities) {
            data.additionalStyles.utilities =
              data.additionalStyles.utilities.map((utility: any) => {
                // Standardize utility structure - ensure we always use 'className' and 'definition'
                const className = utility.className || utility.name || ""
                const definition =
                  utility.definition || utility.properties || ""

                if (!definition || definition === "undefined") {
                  // Provide a default example utility definition
                  return {
                    className,
                    definition: "/* Add your custom styles here */",
                  }
                }
                return { className, definition }
              })
          }
        }

        if (styleUpdateFiles.length > 0) {
          setActionRequiredFiles(styleUpdateFiles)
        }

        // Load dependencies and handle the unresolved components
        const { remainingComponents, updatedLoadingPaths, allDependencySlugs } =
          await loadDependencies(data)

        // Update processed data with the updated unresolved dependencies
        data.unresolvedDependencyImports = remainingComponents

        // Set processed data BEFORE setting active preview
        setProcessedData(data)

        // AFTER setting processed data, set the active preview
        const newComponentPath = `/components/${data.registryType || "ui"}/${data.slug ? `${data.slug}.tsx` : "component.tsx"}`

        // Create a mock files object for preview selection with the ORIGINAL component code
        const mockFiles = {
          [newComponentPath]: { code: originalComponentCode },
        }

        handlePreviewSelect(
          {
            type: "regular",
            filePath: newComponentPath,
          },
          mockFiles,
        )

        // If we have dependencies to resolve, do that next
        if (allDependencySlugs.length > 0) {
          await resolveDependencies(allDependencySlugs, updatedLoadingPaths)
        }

        toast.success("Component processed successfully")
      } catch (error) {
        toast.error(
          `Processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
        console.error("Error processing component:", error)
        setLoadingShadcnComponents([])
      } finally {
        setIsProcessing(false)
      }
    },
    [
      userId,
      setIsProcessing,
      setLoadingShadcnComponents,
      setActionRequiredFiles,
      handlePreviewSelect,
      loadDependencies,
      resolveDependencies,
    ],
  )

  return {
    processedData,
    getComponentFilePath,
    handleProcessComponent,
    setProcessedData,
  }
}
