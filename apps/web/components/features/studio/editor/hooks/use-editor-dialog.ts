import { useState, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { generateSandpackFiles } from "../sandpack-files"
import { resolveRegistryDependencyTree } from "@/lib/queries.server"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { defaultGlobalCss, defaultTailwindConfig } from "@/lib/sandpack"
import type { SandpackFiles } from "@codesandbox/sandpack-react"

// Define a type for the active preview
type ActivePreview = {
  type: "regular" | "unknown" // "regular" for normal files, "unknown" for custom components
  filePath: string // The file path (always set)
  componentName?: string // Only set for unknown components
}

interface UsePublishDialogProps {
  userId: string
}

export function usePublishDialog({ userId }: UsePublishDialogProps) {
  // Dialog state
  const [open, setOpen] = useState(false)
  const [componentCode, setComponentCode] = useState("// Paste your code here")
  const [processedData, setProcessedData] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  // Unified active preview state
  const [activePreview, setActivePreview] = useState<ActivePreview | null>(null)

  const [registryDependencies, setRegistryDependencies] = useState<
    Record<string, { code: string; registry: string }>
  >({})
  const [
    npmDependenciesOfRegistryDependencies,
    setNpmDependenciesOfRegistryDependencies,
  ] = useState<Record<string, string>>({})
  const [mergedTailwindConfig, setMergedTailwindConfig] = useState<
    string | null
  >(null)
  const [mergedGlobalCss, setMergedGlobalCss] = useState<string | null>(null)
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
    setActivePreview(null)
    setRegistryDependencies({})
    setNpmDependenciesOfRegistryDependencies({})
    setMergedTailwindConfig(null)
    setMergedGlobalCss(null)
  }, [])

  // Handle dialog open/close
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen)
      if (!isOpen) resetState()
    },
    [resetState],
  )

  // Generate files for Sandpack
  const files = useMemo(() => {
    const componentPath = getComponentFilePath()
    console.log("[PublishDialog] Generating Sandpack files:", {
      componentPath,
      processedData: {
        registryType: processedData?.registryType,
        slug: processedData?.slug,
        componentName: processedData?.componentName,
      },
      hasComponentCode: Boolean(componentCode),
      registryDependenciesFiles: Object.keys(registryDependencies),
      activePreviewPath: activePreview?.filePath,
    })

    // Start with a fresh copy of all files
    const allFiles: SandpackFiles = {}

    // Add registry dependencies first
    Object.entries(registryDependencies).forEach(([path, content]) => {
      allFiles[path] = {
        code: typeof content === "string" ? content : content.code,
      }
    })

    // Generate base files
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
      customTailwindConfig: mergedTailwindConfig,
      customGlobalCss: mergedGlobalCss,
    })

    // Add all generated files
    Object.entries(generatedFiles).forEach(([path, content]) => {
      // Skip component.tsx if we have a processed slug
      if (processedData?.slug && path === "/components/ui/component.tsx") {
        return
      }
      allFiles[path] = content
    })

    // If we have a processed slug, ensure the component is at the correct path
    if (processedData?.slug && generatedFiles["/components/ui/component.tsx"]) {
      allFiles[componentPath] = generatedFiles["/components/ui/component.tsx"]
      const content = allFiles[componentPath] as string | { code: string }
      console.log("[PublishDialog] Component file placement:", {
        path: componentPath,
        content:
          typeof content === "string"
            ? content.slice(0, 100)
            : content.code.slice(0, 100),
      })
    }

    // Log the content of key files for debugging
    const debugPaths = [
      "/components/blocks/hero-section.tsx",
      "/components/ui/button.tsx",
      "/components/ui/badge.tsx",
      "/components/ui/component.tsx",
    ]

    console.log("[PublishDialog] File contents check:", {
      activePreview: activePreview?.filePath,
      componentPath,
      fileContents: debugPaths.reduce(
        (acc, path) => ({
          ...acc,
          [path]: (() => {
            const content = allFiles[path]
            if (!content) return "not found"
            return (
              (typeof content === "string" ? content : content.code).slice(
                0,
                50,
              ) + "..."
            )
          })(),
        }),
        {},
      ),
      allFiles: Object.keys(allFiles),
    })

    return allFiles
  }, [
    getComponentFilePath,
    componentCode,
    processedData,
    npmDependenciesOfRegistryDependencies,
    registryDependencies,
    mergedTailwindConfig,
    mergedGlobalCss,
    activePreview?.filePath,
  ])

  // Unified handler for preview selection (both files and custom components)
  const handlePreviewSelect = useCallback(
    (newPreview: ActivePreview) => {
      console.log("[PublishDialog] handlePreviewSelect called with:", {
        newPreview,
        currentFiles: Object.keys(files),
      })

      setActivePreview(newPreview)

      // Always update component code for regular files
      if (newPreview.type === "regular") {
        const fileContent = files[newPreview.filePath]
        console.log(
          "[PublishDialog] Updating component code with file content:",
          {
            path: newPreview.filePath,
            fileContent,
            allFiles: Object.keys(files).map((path) => ({
              path,
              preview: (() => {
                const content = files[path]
                if (!content) return "not found"
                return (
                  (typeof content === "string" ? content : content.code).slice(
                    0,
                    50,
                  ) + "..."
                )
              })(),
            })),
          },
        )

        if (fileContent) {
          const newCode =
            typeof fileContent === "string" ? fileContent : fileContent.code

          if (newCode) {
            setComponentCode(newCode)
            console.log("[PublishDialog] Updated component code:", {
              path: newPreview.filePath,
              codePreview: newCode.slice(0, 100),
            })
          }
        }
      }
    },
    [files],
  )

  // Merge styles from dependencies
  const mergeStyles = useCallback(
    async (styles: { tailwindConfig?: string; globalCss?: string }[]) => {
      const customTailwindConfigs = styles
        .map((s) => s.tailwindConfig)
        .filter((config): config is string => !!config)

      const customGlobalCssStyles = styles
        .map((s) => s.globalCss)
        .filter((css): css is string => !!css)

      // Parallel requests for merging styles
      const requests: Promise<any>[] = []

      if (customTailwindConfigs.length > 0) {
        requests.push(
          fetch("/api/studio/merge-styles/tailwind", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              defaultConfig: defaultTailwindConfig,
              dependencyConfigs: customTailwindConfigs,
            }),
          }).then((res) => res.json()),
        )
      }

      if (customGlobalCssStyles.length > 0) {
        requests.push(
          fetch("/api/studio/merge-styles/globals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              defaultGlobalCss: defaultGlobalCss,
              dependencyGlobalCss: customGlobalCssStyles,
            }),
          }).then((res) => res.json()),
        )
      }

      if (requests.length === 0) {
        return {
          tailwindConfig: defaultTailwindConfig,
          globalCss: defaultGlobalCss,
        }
      }

      try {
        const results = await Promise.all(requests)
        return {
          tailwindConfig:
            results.find((r) => r.tailwindConfig)?.tailwindConfig ||
            defaultTailwindConfig,
          globalCss:
            results.find((r) => r.globalCss)?.globalCss || defaultGlobalCss,
        }
      } catch (error) {
        console.error("Error merging styles:", error)
        toast.error("Failed to merge styles from dependencies")
        return {
          tailwindConfig: defaultTailwindConfig,
          globalCss: defaultGlobalCss,
        }
      }
    },
    [],
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

      // Set the processed component as active file
      const newComponentPath = `/components/${data.registryType || "ui"}/${data.slug ? `${data.slug}.tsx` : "component.tsx"}`
      handlePreviewSelect({
        type: "regular",
        filePath: newComponentPath,
      })

      // If we have shadcn component dependencies, resolve them
      if (data.shadcnComponentsImports?.length > 0) {
        const slugs = data.shadcnComponentsImports.map(
          (component: { name: string }) =>
            `shadcn/${component.name.toLowerCase().replace(/\s+/g, "-")}`,
        )

        const result = await resolveRegistryDependencyTree({
          supabase,
          sourceDependencySlugs: slugs,
          withDemoDependencies: false,
          withStyles: true, // Enable styles fetching
        })

        if (result.error) {
          throw new Error(
            `Failed to resolve dependencies: ${result.error.message}`,
          )
        }

        setRegistryDependencies(result.data.filesWithRegistry)
        setNpmDependenciesOfRegistryDependencies(result.data.npmDependencies)

        // Merge styles if we have any
        if (result.data.styles) {
          const { tailwindConfig, globalCss } = await mergeStyles([
            result.data.styles,
          ])
          setMergedTailwindConfig(tailwindConfig)
          setMergedGlobalCss(globalCss)
        }
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

  // Helper to check if a file is an unknown component
  const isUnknownComponent = useCallback(
    (path: string) => {
      return (
        processedData?.nonShadcnComponentsImports?.some(
          (comp: { path: string }) => comp.path === path,
        ) ?? false
      )
    },
    [processedData],
  )

  // Sandpack configuration
  const sandpackConfig = useMemo(() => {
    console.log("[PublishDialog] Creating Sandpack config:", {
      activePreview,
      componentPath: getComponentFilePath(),
      availableFiles: Object.keys(files),
      registryDependencies: Object.keys(registryDependencies),
    })

    return {
      files,
      options: {
        activeFile:
          activePreview?.type === "regular"
            ? activePreview.filePath
            : getComponentFilePath(),
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
  }, [
    files,
    getComponentFilePath,
    activePreview,
    registryDependencies,
    processedData?.npmDependencies,
    npmDependenciesOfRegistryDependencies,
    isDarkTheme,
  ])

  return {
    open,
    componentCode,
    processedData,
    isProcessing,
    isPublishing,
    activePreview,
    handleOpenChange,
    handleProcessComponent,
    handlePreviewSelect,
    setComponentCode,
    sandpackConfig,
    getComponentFilePath,
    isUnknownComponent,
  }
}
