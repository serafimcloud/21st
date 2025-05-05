import { useMemo } from "react"
import { useTheme } from "next-themes"
import type { SandpackFiles } from "@codesandbox/sandpack-react"
import { generateSandpackFiles } from "../utils/sandpack-files"

interface UseSandpackConfigProps {
  componentPath: string
  componentCode: string
  processedData: any | null
  registryDependencies: Record<string, { code: string; registry: string }>
  npmDependenciesOfRegistryDependencies: Record<string, string>
  activePreviewFilePath: string | null
  initialCompiledCss: string | null
  generateStylesCss: () => string
  generateAppTsx: () => string
  fileContentCache: Map<string, string>
  isProcessing: boolean
}

/**
 * Hook for generating and managing Sandpack configuration
 */
export function useSandpackConfig({
  componentPath,
  componentCode,
  processedData,
  registryDependencies,
  npmDependenciesOfRegistryDependencies,
  activePreviewFilePath,
  initialCompiledCss,
  generateStylesCss,
  generateAppTsx,
  fileContentCache,
  isProcessing,
}: UseSandpackConfigProps) {
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"

  // Generate files for Sandpack
  const files = useMemo(() => {
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
          "[useSandpackConfig] Restoring cached content for:",
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
    componentPath,
    componentCode,
    processedData,
    npmDependenciesOfRegistryDependencies,
    registryDependencies,
    activePreviewFilePath,
    initialCompiledCss,
    generateStylesCss,
    generateAppTsx,
    fileContentCache,
    isDarkTheme,
  ])

  // Sandpack configuration
  const sandpackConfig = useMemo(() => {
    return {
      files,
      options: {
        activeFile: activePreviewFilePath || componentPath,
        visibleFiles: [
          componentPath,
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
    componentPath,
    activePreviewFilePath,
    registryDependencies,
    processedData?.npmDependencies,
    npmDependenciesOfRegistryDependencies,
    isDarkTheme,
    processedData,
    isProcessing,
  ])

  return {
    files,
    sandpackConfig,
  }
}
