import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { generateSandpackFiles } from "../utils/sandpack-files"
import { resolveRegistryDependencyTree } from "@/lib/queries.server"
import { useClerkSupabaseClient } from "@/lib/clerk"
import {
  defaultGlobalCss as globalCss,
  defaultTailwindConfig as tailwindConfig,
} from "@/lib/defaults"
import {
  lookupComponentsInDatabase,
  convertComponentMatchesToDependencySlugs,
} from "@/components/features/studio/editor/utils/component-lookup"
import type { SandpackFiles } from "@codesandbox/sandpack-react"
import { useCssCompiler } from "./use-css-compiler"

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

// Define the generateStylesCss function up front so it can be used in the files useMemo
const generateStylesCss = () => {
  return globalCss
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
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"
  const supabase = useClerkSupabaseClient()

  // Add new state to track loading components and config files
  const [loadingShadcnComponents, setLoadingShadcnComponents] = useState<
    string[]
  >([])
  // Add new state for tracking files that need action (style updates)
  const [actionRequiredFiles, setActionRequiredFiles] = useState<string[]>([])

  // Add ref to track the timeout ID for loading state
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Add max timeout for safety
  const maxLoadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // We'll track our own initial compiledCss state directly in the files useMemo
  const [initialCompiledCss, setInitialCompiledCss] = useState<string | null>(
    null,
  )

  // Get component file path
  const getComponentFilePath = useCallback(() => {
    if (!processedData) return "/components/ui/component.tsx"

    const registryType = processedData.registryType || "ui"
    const fileName = processedData.slug
      ? `${processedData.slug}.tsx`
      : "component.tsx"
    return `/components/${registryType}/${fileName}`
  }, [processedData])

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

  // Helper function to generate a simple App.tsx that can handle demo files with both named and default exports
  const generateAppTsx = () => {
    console.log("[generateAppTsx] Generating App.tsx with demo import")
    return `import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { RouterProvider } from 'next/router';
import './styles.css';
import DefaultExport, * as NamedExports from './demo';

// Log what's available in the demo file for debugging
console.log('Demo components loaded:', {
  defaultExport: DefaultExport,
  namedExports: Object.keys(NamedExports).filter(k => k !== 'default')
});

// Combine named exports and default export components
const demoComponentNames = [
  ...(DefaultExport && typeof DefaultExport === 'object' ? Object.keys(DefaultExport) : []),
  ...Object.keys(NamedExports).filter(key => 
    typeof NamedExports[key] === 'function' && key !== 'default'
  )
];

console.log('Available demo component names:', demoComponentNames);

const DemoComponents = {
  ...(DefaultExport && typeof DefaultExport === 'object' ? DefaultExport : {}),
  ...(typeof DefaultExport === 'function' ? { Demo: DefaultExport } : {}),
  ...Object.fromEntries(
    Object.entries(NamedExports).filter(([key, value]) => 
      typeof value === 'function' && key !== 'default'
    )
  )
};

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Handle both object of components and direct function component export
  const getComponent = () => {
    if (demoComponentNames.length > 0) {
      return DemoComponents[demoComponentNames[currentIndex]];
    } else if (typeof DefaultExport === 'function') {
      return DefaultExport;
    } else {
      return () => <div className="p-6 text-center">Add components to demo.tsx</div>;
    }
  };
  
  const CurrentComponent = getComponent();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && demoComponentNames.length > 1) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setCurrentIndex(prev => (prev + 1) % demoComponentNames.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setCurrentIndex(prev => (prev - 1 + demoComponentNames.length) % demoComponentNames.length);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <RouterProvider>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
          {demoComponentNames.length > 1 && (
            <div className="self-end mb-4">
              <select 
                value={demoComponentNames[currentIndex]} 
                onChange={(e) => {
                  const idx = demoComponentNames.indexOf(e.target.value);
                  if (idx !== -1) setCurrentIndex(idx);
                }}
                className="p-2 border rounded bg-background text-foreground"
              >
                {demoComponentNames.map(name => (
                  <option key={name} value={name}>
                    {name.replace(/([A-Z])/g, ' $1').trim()}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex items-center justify-center w-full">
            <CurrentComponent />
          </div>
        </div>
      </RouterProvider>
    </ThemeProvider>
  );
}`
  }

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
      theme: isDarkTheme ? "dark" : "light",
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
    allFiles["/demo.tsx"] = {
      code: `// Add your demo code here
import React from 'react';

// This component will be recognized by the CSS compiler and styles will be generated
export default function Demo() {
  return (
    <div className="p-4">
      {/* Add your component demo here */}
      <div className="border-2 border-dashed border-gray-200 p-6 rounded-lg text-center">
        Edit this file to create your component demo
      </div>
    </div>
  );
}

// You can also add named exports for multiple demos
/*
export function SecondDemo() {
  return (
    <div className="p-4 bg-muted rounded-lg">
      Another demo component
    </div>
  );
}
*/
`,
    }

    // Add any cached file content for unknown components
    fileContentCache.forEach((cachedContent, cachedPath) => {
      if (
        processedData?.unresolvedDependencyImports?.some((comp: any) => {
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

    // Add a simple App.tsx that imports and renders demo.tsx
    allFiles["/App.tsx"] = { code: generateAppTsx() }

    // Add styles.css file with the compiled CSS from our hook
    allFiles["/styles.css"] = {
      code: initialCompiledCss || generateStylesCss(),
    }

    return allFiles
  }, [
    getComponentFilePath,
    componentCode,
    processedData,
    npmDependenciesOfRegistryDependencies,
    registryDependencies,
    activePreview?.filePath,
    initialCompiledCss,
    generateStylesCss,
  ])

  // Use our CSS compiler hook
  const { compiledCss, forceRecompile } = useCssCompiler({
    componentCode,
    processedData,
    isProcessing,
    registryDependencies,
    files,
    globalCss,
    tailwindConfig,
    getComponentFilePath,
  })

  // Update the initial compiled CSS when the compiled CSS changes
  useEffect(() => {
    if (compiledCss) {
      setInitialCompiledCss(compiledCss)
    }
  }, [compiledCss])

  // Reset dialog state
  const resetState = useCallback(() => {
    setComponentCode("")
    setProcessedData(null)
    setIsProcessing(false)
    setIsPublishing(false)
    setActivePreview(null)
    setRegistryDependencies({})
    setNpmDependenciesOfRegistryDependencies({})
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

      if (data.unresolvedDependencyImports?.length > 0) {
        // Look up components in the database
        const { lookupResults, remainingComponents } =
          await lookupComponentsInDatabase(
            supabase,
            data.unresolvedDependencyImports,
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

        // Update processed data with the updated unresolved dependencies
        data.unresolvedDependencyImports = remainingComponents
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
          if (data.unresolvedDependencyImports?.length > 0) {
            const { lookupResults: dbLookup } =
              await lookupComponentsInDatabase(
                supabase,
                data.unresolvedDependencyImports,
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
      setActionRequiredFiles([])
    } finally {
      setIsProcessing(false)

      // Set a final cleanup timer just to be safe (with a shorter timeout)
      loadingTimeoutRef.current = setTimeout(() => {
        if (loadingShadcnComponents.length > 0) {
          setLoadingShadcnComponents([])
        }
        loadingTimeoutRef.current = null
      }, 5000) // 5 seconds should be enough for any remaining files
    }
  }

  // Helper to check if a file is an unresolved dependency
  const isUnresolvedDependency = useCallback(
    (path: string) => {
      return (
        processedData?.unresolvedDependencyImports?.some(
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

  // Handle file changes from Sandpack editor
  const handleFileChange = useCallback(
    (path: string, fileContent: string) => {
      console.log(
        `[handleFileChange] File ${path} changed, updating files state`,
      )

      // If this is the demo file, make sure we update our files state
      if (path === "/demo.tsx") {
        console.log(
          "[handleFileChange] Demo file changed, length:",
          fileContent.length,
        )

        // Cache the changes
        fileContentCache.set(path, fileContent)

        // Update the files object directly
        files[path] = { code: fileContent }

        // Force CSS recompilation to pick up the changes
        forceRecompile()
      }
    },
    [files, forceRecompile],
  )

  return {
    open,
    componentCode,
    processedData,
    isProcessing,
    isPublishing,
    activePreview,
    loadingShadcnComponents,
    actionRequiredFiles,
    handleOpenChange,
    handleProcessComponent,
    handlePreviewSelect,
    setComponentCode: setComponentCodeWithCache,
    getCachedFileContent,
    sandpackConfig,
    getComponentFilePath,
    isUnresolvedDependency,
    handleFileChange, // Export the handler for Sandpack component
  }
}
