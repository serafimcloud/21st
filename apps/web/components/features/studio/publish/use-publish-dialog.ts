import { useState, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import type { SandpackFiles } from "@codesandbox/sandpack-react"
import { generateSandpackFiles } from "./sandpack-files"

interface UsePublishDialogProps {
  userId: string
}

export function usePublishDialog({ userId }: UsePublishDialogProps) {
  // Dialog state
  const [open, setOpen] = useState(false)
  const [componentCode, setComponentCode] = useState("")
  const [processedData, setProcessedData] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"

  // Get component file path
  const getComponentFilePath = useCallback(() => {
    if (!processedData) return "/components/ui/component.tsx"

    const registryType = processedData.registryType || "ui"
    const fileName = processedData.slug
      ? `${processedData.slug}.tsx`
      : "component.tsx"
    return `/components/${registryType}/${fileName}`
  }, [processedData])

  // Reset dialog state
  const resetState = useCallback(() => {
    setComponentCode("")
    setProcessedData(null)
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

  // Process component
  const handleProcessComponent = async () => {
    if (!componentCode.trim()) {
      toast.error("Please enter component code")
      return
    }

    setIsProcessing(true)

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
      setProcessedData(data)
      toast.success("Component processed successfully")
    } catch (error) {
      toast.error(
        `Processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
      console.error("Error processing component:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Generate files for Sandpack
  const files = useMemo(() => {
    const componentPath = getComponentFilePath()
    return generateSandpackFiles({
      componentPath,
      componentCode,
      processedData,
      dependencies: processedData?.npmDependencies?.reduce(
        (acc: Record<string, string>, dep: string) => ({
          ...acc,
          [dep]: "latest",
        }),
        {},
      ),
    })
  }, [componentCode, processedData, getComponentFilePath])

  // Sandpack configuration
  const sandpackConfig = useMemo(
    () => ({
      files,
      options: {
        activeFile: getComponentFilePath(),
        visibleFiles: [
          getComponentFilePath(),
          "/components",
          "/tailwind.config.js",
          "/globals.css",
          "/package.json",
        ],
        recompileMode: "delayed" as const,
        recompileDelay: 300,
      },
      template: "react-ts" as const,
      theme: isDarkTheme ? ("dark" as const) : ("light" as const),
      customSetup: {
        dependencies:
          processedData?.npmDependencies?.reduce(
            (acc: Record<string, string>, dep: string) => ({
              ...acc,
              [dep]: "latest",
            }),
            {},
          ) || {},
      },
    }),
    [files, getComponentFilePath, isDarkTheme, processedData?.npmDependencies],
  )

  return {
    open,
    componentCode,
    processedData,
    isProcessing,
    isPublishing,
    handleOpenChange,
    handleProcessComponent,
    setComponentCode,
    sandpackConfig,
    getComponentFilePath,
  }
}
