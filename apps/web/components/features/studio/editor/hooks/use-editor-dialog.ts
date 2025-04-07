import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { generateSandpackFiles } from "../utils/sandpack-files"
import { resolveRegistryDependencyTree } from "@/lib/queries.server"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { defaultGlobalCss, defaultTailwindConfig } from "@/lib/defaults"
import {
  lookupComponentsInDatabase,
  convertComponentMatchesToDependencySlugs,
} from "@/components/features/studio/editor/utils/component-lookup"
import type { SandpackFiles } from "@codesandbox/sandpack-react"

// Create a file content cache that persists across component remounts
const fileContentCache = new Map<string, string>()

// Define a type for the active preview
type ActivePreview = {
  type: "regular" | "unknown"
  filePath: string // The file path (always set)
  componentName?: string // Only used for unknown components
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
  // Add new state for tracking files that need action (style updates)
  const [actionRequiredFiles, setActionRequiredFiles] = useState<string[]>([])

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
    setActionRequiredFiles([])
  }, [])

  // Handle dialog open/close
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen)
      if (!isOpen) resetState()
    },
    [resetState],
  )

  // Set the component code and also update cache
  const setComponentCodeWithCache = useCallback(
    (code: string, path?: string) => {
      const filePath = path || activePreview?.filePath
      setComponentCode(code)

      // Store in cache if we have a valid path
      if (filePath) {
        console.log("[usePublishDialog] Caching file content:", {
          path: filePath,
          codeLength: code.length,
        })
        fileContentCache.set(filePath, code)
      }
    },
    [activePreview?.filePath],
  )

  // Helper function to get cached content
  const getCachedFileContent = useCallback((path: string) => {
    return fileContentCache.get(path)
  }, [])

  // Generate files for Sandpack
  const files = useMemo(() => {
    const componentPath = getComponentFilePath()

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
    }

    // Add empty demo.tsx file
    allFiles["/demo.tsx"] = { code: "// Add your demo code here" }

    // Add any cached file content for unknown components
    fileContentCache.forEach((cachedContent, cachedPath) => {
      if (
        processedData?.nonShadcnComponentsImports?.some((comp: any) => {
          const normalizedPath = comp.path.replace(/^@\//, "/")
          return normalizedPath === cachedPath
        })
      ) {
        console.log(
          "[usePublishDialog] Restoring cached content for:",
          cachedPath,
        )
        allFiles[cachedPath] = { code: cachedContent }
      }
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

  // Unified handler for preview selection
  const handlePreviewSelect = useCallback(
    (newPreview: ActivePreview) => {
      setActivePreview(newPreview)

      // Always update component code for files
      const fileContent = files[newPreview.filePath]

      if (fileContent) {
        const newCode =
          typeof fileContent === "string" ? fileContent : fileContent.code

        if (newCode) {
          setComponentCode(newCode)
        }
      }
    },
    [files],
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
    setActionRequiredFiles([]) // Reset action required files

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
          data.additionalStyles.keyframes = data.additionalStyles.keyframes.map(
            (keyframe: any) => {
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
            },
          )
        }

        if (data.additionalStyles.utilities) {
          data.additionalStyles.utilities = data.additionalStyles.utilities.map(
            (utility: any) => {
              // Standardize utility structure - ensure we always use 'className' and 'definition'
              const className = utility.className || utility.name || ""
              const definition = utility.definition || utility.properties || ""

              if (!definition || definition === "undefined") {
                // Provide a default example utility definition
                return {
                  className,
                  definition: "/* Add your custom styles here */",
                }
              }
              return { className, definition }
            },
          )
        }
      }

      if (styleUpdateFiles.length > 0) {
        setActionRequiredFiles(styleUpdateFiles)
      }

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
            }
          })

          setRegistryDependencies(result.data.filesWithRegistry)
          setNpmDependenciesOfRegistryDependencies(result.data.npmDependencies)

          // Merge styles if we have any
          if (result.data.styles) {
            // Use defaults for now
            setMergedTailwindConfig(defaultTailwindConfig)
            setMergedGlobalCss(defaultGlobalCss)
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
      setActionRequiredFiles([])
    } finally {
      setIsProcessing(false)

      // Set a final cleanup timer just to be safe (with a shorter timeout)
      loadingTimeoutRef.current = setTimeout(() => {
        if (loadingShadcnComponents.length > 0) {
          setLoadingShadcnComponents([])
        }
        if (loadingStyleFiles.length > 0) {
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
          // Add demo.tsx to visible files after processing is complete
          ...(processedData && !isProcessing ? ["/demo.tsx"] : []),
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
    processedData,
    isProcessing,
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
    actionRequiredFiles,
    handleOpenChange,
    handleProcessComponent,
    handlePreviewSelect,
    setComponentCode: setComponentCodeWithCache,
    getCachedFileContent,
    sandpackConfig,
    getComponentFilePath,
    isUnknownComponent,
  }
}
