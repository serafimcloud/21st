import { useState, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import type { SandpackFiles } from "@codesandbox/sandpack-react"
import { generateSandpackFiles } from "./sandpack-files"
import { resolveRegistryDependencyTree } from "@/lib/queries.server"
import { useClerkSupabaseClient } from "@/lib/clerk"

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
  const [registryDependencies, setRegistryDependencies] = useState<
    Record<string, { code: string; registry: string }>
  >({})
  const [
    npmDependenciesOfRegistryDependencies,
    setNpmDependenciesOfRegistryDependencies,
  ] = useState<Record<string, string>>({})
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"
  const supabase = useClerkSupabaseClient()

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
    setRegistryDependencies({})
    setNpmDependenciesOfRegistryDependencies({})
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
      console.log("Preprocessing Response:", {
        componentName: data.componentName,
        registryType: data.registryType,
        shadcnComponents: data.shadcnComponentsImports,
        npmDeps: data.npmDependencies,
        fullResponse: data,
      })

      setProcessedData(data)

      // If we have shadcn component dependencies, resolve them
      if (data.shadcnComponentsImports?.length > 0) {
        console.log("Found shadcn components:", data.shadcnComponentsImports)

        const slugs = data.shadcnComponentsImports.map(
          (componentName: string) =>
            `shadcn/${componentName.toLowerCase().replace(/\s+/g, "-")}`,
        )
        console.log("Generated slugs for resolution:", slugs)

        const result = await resolveRegistryDependencyTree({
          supabase,
          sourceDependencySlugs: slugs,
          withDemoDependencies: false,
        })

        if (result.error) {
          throw new Error(
            `Failed to resolve dependencies: ${result.error.message}`,
          )
        }

        console.log("Registry Dependencies Resolution:", {
          filesReceived: Object.keys(result.data.filesWithRegistry),
          npmDepsReceived: result.data.npmDependencies,
          fullResponse: result.data,
        })

        setRegistryDependencies(result.data.filesWithRegistry)
        setNpmDependenciesOfRegistryDependencies(result.data.npmDependencies)
      }

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
    const generatedFiles = generateSandpackFiles({
      componentPath,
      componentCode,
      processedData,
      dependencies: {
        ...(processedData?.npmDependencies?.reduce(
          (acc: Record<string, string>, dep: string) => ({
            ...acc,
            [dep]: "latest",
          }),
          {},
        ) || {}),
        ...npmDependenciesOfRegistryDependencies,
      },
    })

    console.log("Sandpack Files Generation:", {
      baseFiles: Object.keys(generatedFiles),
      registryDependencies: Object.keys(registryDependencies),
      finalFiles: Object.keys({
        ...registryDependencies,
        ...generatedFiles,
      }),
    })

    return {
      ...registryDependencies,
      ...generatedFiles,
    }
  }, [
    componentCode,
    processedData,
    getComponentFilePath,
    registryDependencies,
    npmDependenciesOfRegistryDependencies,
  ])

  // Sandpack configuration
  const sandpackConfig = useMemo(() => {
    const config = {
      files,
      options: {
        activeFile: getComponentFilePath(),
        visibleFiles: [
          getComponentFilePath(),
          "/components",
          "/tailwind.config.js",
          "/globals.css",
          "/package.json",
          ...Object.keys(registryDependencies),
        ],
        recompileMode: "delayed" as const,
        recompileDelay: 300,
      },
      template: "react-ts" as const,
      theme: isDarkTheme ? ("dark" as const) : ("light" as const),
      customSetup: {
        dependencies: {
          ...(processedData?.npmDependencies?.reduce(
            (acc: Record<string, string>, dep: string) => ({
              ...acc,
              [dep]: "latest",
            }),
            {},
          ) || {}),
          ...npmDependenciesOfRegistryDependencies,
        },
      },
    }

    console.log("Final Sandpack Config:", {
      visibleFiles: config.options.visibleFiles,
      allFiles: Object.keys(config.files),
      dependencies: config.customSetup.dependencies,
    })

    return config
  }, [
    files,
    getComponentFilePath,
    isDarkTheme,
    processedData?.npmDependencies,
    registryDependencies,
    npmDependenciesOfRegistryDependencies,
  ])

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
