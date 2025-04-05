import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { generateSandpackFiles } from "../sandpack-files"
import { resolveRegistryDependencyTree } from "@/lib/queries.server"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { defaultGlobalCss, defaultTailwindConfig } from "@/lib/sandpack"
import {
  lookupComponentsInDatabase,
  convertComponentMatchesToDependencySlugs,
} from "@/lib/component-lookup"
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

  // Add new state to track loading components and config files
  const [loadingShadcnComponents, setLoadingShadcnComponents] = useState<
    string[]
  >([])
  // Add new state for tracking style merging status
  const [loadingStyleFiles, setLoadingStyleFiles] = useState<string[]>([])

  // Add ref to track the timeout ID for loading state
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Add max timeout for safety
  const maxLoadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Safety cleanup for loading state
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      if (maxLoadingTimeoutRef.current) {
        clearTimeout(maxLoadingTimeoutRef.current)
      }
    }
  }, [])

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

      // Prepare result object
      const result: {
        tailwindConfig: string
        globalCss: string
      } = {
        tailwindConfig: defaultTailwindConfig,
        globalCss: defaultGlobalCss,
      }

      // Track each file loading state individually
      const tailwindConfigPromise =
        customTailwindConfigs.length > 0
          ? (async () => {
              // Set loading state
              setLoadingStyleFiles((prev) => [...prev, "/tailwind.config.js"])
              console.log("[usePublishDialog] Started merging tailwind config")

              try {
                const response = await fetch(
                  "/api/studio/merge-styles/tailwind",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      defaultConfig: defaultTailwindConfig,
                      dependencyConfigs: customTailwindConfigs,
                    }),
                  },
                )

                const data = await response.json()
                result.tailwindConfig =
                  data.tailwindConfig || defaultTailwindConfig

                console.log(
                  "[usePublishDialog] Completed merging tailwind config",
                )
                return data
              } catch (error) {
                console.error("Error merging tailwind config:", error)
                toast.error("Failed to merge tailwind config")
                return { tailwindConfig: defaultTailwindConfig }
              } finally {
                // Always clear loading state when done, whether successful or not
                setLoadingStyleFiles((prev) =>
                  prev.filter((filePath) => filePath !== "/tailwind.config.js"),
                )
              }
            })()
          : Promise.resolve({ tailwindConfig: defaultTailwindConfig })

      const globalCssPromise =
        customGlobalCssStyles.length > 0
          ? (async () => {
              // Set loading state
              setLoadingStyleFiles((prev) => [...prev, "/globals.css"])
              console.log("[usePublishDialog] Started merging global CSS")

              try {
                const response = await fetch(
                  "/api/studio/merge-styles/globals",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      defaultGlobalCss: defaultGlobalCss,
                      dependencyGlobalCss: customGlobalCssStyles,
                    }),
                  },
                )

                const data = await response.json()
                result.globalCss = data.globalCss || defaultGlobalCss

                console.log("[usePublishDialog] Completed merging global CSS")
                return data
              } catch (error) {
                console.error("Error merging global CSS:", error)
                toast.error("Failed to merge global CSS")
                return { globalCss: defaultGlobalCss }
              } finally {
                // Always clear loading state when done, whether successful or not
                setLoadingStyleFiles((prev) =>
                  prev.filter((filePath) => filePath !== "/globals.css"),
                )
              }
            })()
          : Promise.resolve({ globalCss: defaultGlobalCss })

      // Wait for both promises to complete
      await Promise.all([tailwindConfigPromise, globalCssPromise])

      return result
    },
    [],
  )

  // Process component
  const handleProcessComponent = async () => {
    if (!componentCode.trim()) {
      toast.error("Please enter component code")
      return
    }

    // Clear any existing timeouts
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }

    if (maxLoadingTimeoutRef.current) {
      clearTimeout(maxLoadingTimeoutRef.current)
      maxLoadingTimeoutRef.current = null
    }

    setIsProcessing(true)
    setLoadingShadcnComponents([]) // Reset loading state at the start
    setLoadingStyleFiles([]) // Reset style loading state too

    console.log(
      "[usePublishDialog] Starting component processing, cleared all loading states",
    )

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

      // Set loading state for shadcn components
      const shadcnSlugs: string[] = []

      if (data.shadcnComponentsImports?.length > 0) {
        const loadingPaths = data.shadcnComponentsImports.map(
          (component: { name: string }) => {
            const path = `/components/ui/${component.name.toLowerCase()}.tsx`
            shadcnSlugs.push(
              `shadcn/${component.name.toLowerCase().replace(/\s+/g, "-")}`,
            )
            return path
          },
        )
        console.log(
          "[usePublishDialog] Setting loading components:",
          loadingPaths,
        )
        setLoadingShadcnComponents(loadingPaths)
      }

      // Check for non-shadcn components in the database
      const dbComponentSlugs: string[] = []

      if (data.nonShadcnComponentsImports?.length > 0) {
        // Look up components in the database
        const { lookupResults, remainingComponents } =
          await lookupComponentsInDatabase(
            supabase,
            data.nonShadcnComponentsImports,
          )

        // Update the processedData with found matches
        if (lookupResults.length > 0) {
          // Create loading paths for UI feedback
          const dbLoadingPaths = lookupResults.map(
            ({ match }) => `/components/${match.registry}/${match.slug}.tsx`,
          )

          console.log(
            "[usePublishDialog] Found components in database:",
            lookupResults.map((r) => r.match.slug),
          )

          // Add paths to loading state
          setLoadingShadcnComponents((prev) => [...prev, ...dbLoadingPaths])

          // Convert matches to dependency slugs for resolveRegistryDependencyTree
          dbComponentSlugs.push(
            ...convertComponentMatchesToDependencySlugs(lookupResults),
          )
        }

        // Update processed data with the updated non-shadcn component imports
        data.nonShadcnComponentsImports = remainingComponents
      }

      // Set processed data BEFORE setting active preview
      setProcessedData(data)

      // AFTER setting processed data, set the active preview
      const newComponentPath = `/components/${data.registryType || "ui"}/${data.slug ? `${data.slug}.tsx` : "component.tsx"}`
      handlePreviewSelect({
        type: "regular",
        filePath: newComponentPath,
      })

      // Combine both shadcn and database components into a single array
      const allDependencySlugs = [...shadcnSlugs, ...dbComponentSlugs]

      if (allDependencySlugs.length > 0) {
        console.log(
          "[usePublishDialog] Resolving dependencies:",
          allDependencySlugs,
        )

        try {
          // Create a mapping of dependency slugs to their file paths for tracking loading state
          const slugToFilePaths: Record<string, string> = {}

          // Map shadcn components
          data.shadcnComponentsImports?.forEach(
            (component: { name: string }) => {
              const name = component.name.toLowerCase()
              const slug = `shadcn/${name.replace(/\s+/g, "-")}`
              const path = `/components/ui/${name}.tsx`
              slugToFilePaths[slug] = path
            },
          )

          // Map database components from earlier lookupResults
          if (data.nonShadcnComponentsImports?.length > 0) {
            const { lookupResults: dbLookup } =
              await lookupComponentsInDatabase(
                supabase,
                data.nonShadcnComponentsImports,
              )

            dbLookup.forEach((result: any) => {
              const { match } = result
              const slug = `${match.registry}/${match.slug}`
              const path = `/components/${match.registry}/${match.slug}.tsx`
              slugToFilePaths[slug] = path
            })
          }

          // Track which dependencies are loaded
          const loadedDependencies = new Set<string>()

          // Function to call when a dependency is loaded
          const handleDependencyLoaded = (slug: string) => {
            // When a dependency is resolved, remove it from the loading state
            const path = slugToFilePaths[slug]
            if (path) {
              console.log(
                `[usePublishDialog] Dependency loaded: ${slug} (${path})`,
              )
              setLoadingShadcnComponents((prev) =>
                prev.filter((filePath) => filePath !== path),
              )
              loadedDependencies.add(slug)
            }
          }

          const result = await resolveRegistryDependencyTree({
            supabase,
            sourceDependencySlugs: allDependencySlugs,
            withDemoDependencies: false,
            withStyles: true, // Enable styles fetching
          })

          if (result.error) {
            throw new Error(
              `Failed to resolve dependencies: ${result.error.message}`,
            )
          }

          if (!result.data) {
            throw new Error("No data returned from dependency resolution")
          }

          // Process loaded dependencies directly since we've verified data exists
          Object.keys(result.data.filesWithRegistry).forEach((path) => {
            const slug = allDependencySlugs.find((s) => {
              const basePath = path.split("/").pop()?.replace(".tsx", "") || ""
              return s.includes(basePath)
            })

            if (slug && !loadedDependencies.has(slug)) {
              handleDependencyLoaded(slug)
            }

            // Also check if this is a non-Shadcn component path that we need to remove from loading
            const nonShadcnPath = path.startsWith("/components/") ? path : null
            if (nonShadcnPath) {
              setLoadingShadcnComponents((prev) =>
                prev.filter((filePath) => filePath !== nonShadcnPath),
              )
              console.log(
                `[usePublishDialog] Removed non-Shadcn component from loading: ${nonShadcnPath}`,
              )
            }
          })

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
        } catch (depError) {
          console.error("Error resolving dependencies:", depError)
          toast.error(
            `Failed to resolve dependencies: ${depError instanceof Error ? depError.message : "Unknown error"}`,
          )

          // Clear component loading state on error
          setLoadingShadcnComponents([])
        }
      }

      toast.success("Component processed successfully")
    } catch (error) {
      toast.error(
        `Processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
      console.error("Error processing component:", error)
      // Clear loading state immediately in case of main process error
      setLoadingShadcnComponents([])
      setLoadingStyleFiles([])
    } finally {
      setIsProcessing(false)

      // Set a final cleanup timer just to be safe (with a shorter timeout)
      loadingTimeoutRef.current = setTimeout(() => {
        if (loadingShadcnComponents.length > 0) {
          console.log(
            "[usePublishDialog] Final safety cleanup for component loading:",
            loadingShadcnComponents,
          )
          setLoadingShadcnComponents([])
        }
        if (loadingStyleFiles.length > 0) {
          console.log(
            "[usePublishDialog] Final safety cleanup for style loading:",
            loadingStyleFiles,
          )
          setLoadingStyleFiles([])
        }
        loadingTimeoutRef.current = null
      }, 5000) // 5 seconds should be enough for any remaining files
    }
  }

  // Helper to check if a file is an unknown component
  const isUnknownComponent = useCallback(
    (path: string) => {
      return (
        processedData?.nonShadcnComponentsImports?.some(
          (comp: any) => comp.path === path,
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
    loadingShadcnComponents,
    loadingStyleFiles,
    handleOpenChange,
    handleProcessComponent,
    handlePreviewSelect,
    setComponentCode,
    sandpackConfig,
    getComponentFilePath,
    isUnknownComponent,
  }
}
