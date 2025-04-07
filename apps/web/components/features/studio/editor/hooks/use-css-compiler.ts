import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"
import { defaultGlobalCss, defaultTailwindConfig } from "@/lib/defaults"
import type { SandpackFiles } from "@codesandbox/sandpack-react"

interface UseCssCompilerProps {
  componentCode: string
  processedData: any | null
  isProcessing: boolean
  registryDependencies: Record<string, { code: string; registry: string }>
  files: SandpackFiles
  mergedTailwindConfig: string | null
  mergedGlobalCss: string | null
  getComponentFilePath: () => string
}

/**
 * Hook for handling CSS compilation in the editor
 * Extracts and manages all CSS compilation logic in one place
 */
export function useCssCompiler({
  componentCode,
  processedData,
  isProcessing,
  registryDependencies,
  files,
  mergedTailwindConfig,
  mergedGlobalCss,
  getComponentFilePath,
}: UseCssCompilerProps) {
  // State for tracking compilation
  const [compiledCss, setCompiledCss] = useState<string | null>(null)
  const [isCssCompiling, setIsCssCompiling] = useState(false)

  // Refs for tracking and debouncing
  const cssCompileTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const prevFilesHashRef = useRef<string>("")
  const lastCompilationTimeRef = useRef<number>(0)

  // Store the last demo content to track changes specifically to this file
  const lastDemoContentRef = useRef<string>("")

  // Helper function to generate basic styles.css as fallback
  const generateStylesCss = useCallback(() => {
    return defaultGlobalCss
  }, [])

  // Helper function to generate a hash of all key file contents
  const generateFilesHash = useCallback(() => {
    // Always include the demo file as a key file for change detection
    const keyFiles = [
      "/demo.tsx", // Ensure demo file is at the beginning for priority
      getComponentFilePath(),
      "/styles.css",
      "/tailwind.config.js",
    ]

    console.log(
      "[generateFilesHash] Checking for changes in:",
      keyFiles.join(", "),
    )

    // Get the current demo content for separate tracking
    const demoFile = files["/demo.tsx"]
    const currentDemoContent =
      typeof demoFile === "string" ? demoFile : demoFile?.code || ""

    // Check specifically for demo changes
    const demoChanged = currentDemoContent !== lastDemoContentRef.current
    if (demoChanged) {
      console.log(
        "[generateFilesHash] Demo content changed! Forcing recompilation",
      )
    }

    // Collect content of key files
    const contents = keyFiles
      .map((path) => {
        const file = files[path]
        const fileContent = typeof file === "string" ? file : file?.code || ""

        // Log each file's content length for debugging
        if (path === "/demo.tsx") {
          console.log(
            "[generateFilesHash] Demo file content length:",
            fileContent.length,
          )
          // Store current demo content for future comparison
          lastDemoContentRef.current = fileContent
        }

        return `${path}:${fileContent.length}:${fileContent.substring(0, 50)}`
      })
      .join("|")

    // If demo changed, add a timestamp to force hash change
    return demoChanged ? contents + "|demoChanged:" + Date.now() : contents
  }, [files, getComponentFilePath])

  // The main CSS compilation function
  const compileCSS = useCallback(async () => {
    if (!componentCode || !processedData) {
      console.log("[compileCSS] Skipping - no component code or processed data")
      return
    }

    if (isCssCompiling) {
      console.log("[compileCSS] Skipping - compilation already in progress")
      return
    }

    setIsCssCompiling(true)
    console.log("[compileCSS] Starting CSS compilation")

    // Always initialize with the default CSS
    const defaultCss = generateStylesCss()
    setCompiledCss(defaultCss)
    console.log("[compileCSS] Set default CSS fallback")

    // Check if backend URL is available
    const backendUrl = process.env.NEXT_PUBLIC_COMPILE_CSS_URL
    if (!backendUrl) {
      console.log("[compileCSS] Backend URL not available, using default CSS")
      setIsCssCompiling(false)
      return
    }

    console.log("[compileCSS] Backend URL:", backendUrl)

    try {
      // Get the component path based on processed data
      const componentPath = getComponentFilePath()
      console.log("[compileCSS] Component path:", componentPath)

      // Extract all registry dependencies correctly (matching preview.tsx format)
      const registryDependenciesArray = Object.entries(
        registryDependencies || {},
      ).map(([_, item]) => (typeof item === "string" ? item : item.code))
      console.log(
        "[compileCSS] Registry dependencies count:",
        registryDependenciesArray.length,
      )

      // Get demo code directly - ensure it's included separately
      const demoFile = files["/demo.tsx"]
      const demoCode =
        typeof demoFile === "string" ? demoFile : demoFile?.code || ""
      console.log("[compileCSS] Demo code length:", demoCode.length)
      console.log(
        "[compileCSS] Demo code preview:",
        demoCode.substring(0, 100) + "...",
      )

      // Generate shell code exactly like preview.tsx does - make sure we include everything
      const shellCode = Object.entries(files)
        .filter(([key]) => /\.(tsx|jsx|ts|js)$/.test(key))
        .map(([key, value]) => {
          console.log("[compileCSS] Including file:", key)
          return typeof value === "string" ? value : value.code
        })
      console.log("[compileCSS] Shell code count:", shellCode.length)

      // Verify demo.tsx is included in the shell code
      const demoFileIncluded = shellCode.some(
        (code) =>
          code.includes("export default function Demo()") ||
          code.includes("Demo components loaded"),
      )
      if (!demoFileIncluded && demoCode) {
        console.log(
          "[compileCSS] Demo file not found in shell code, manually adding it",
        )
        shellCode.push(demoCode)
      }

      // Combine all dependencies (exactly matching preview.tsx)
      const allDependencies = [...registryDependenciesArray, ...shellCode]
      console.log(
        "[compileCSS] Total dependencies count:",
        allDependencies.length,
      )

      console.log(
        "[compileCSS] Attempting to compile CSS with backend:",
        backendUrl,
      )

      // Prepare request payload - explicitly include demoCode separately to ensure it's used
      const payload = {
        code: componentCode,
        demoCode: demoCode, // Ensure demo code is explicitly included
        baseTailwindConfig: defaultTailwindConfig,
        baseGlobalCss: defaultGlobalCss,
        customTailwindConfig: mergedTailwindConfig || null,
        customGlobalCss: mergedGlobalCss || null,
        dependencies: allDependencies,
      }

      // Additional verification that demo code is included
      if (!payload.demoCode || payload.demoCode.length === 0) {
        console.warn(
          "[compileCSS] Warning: Empty demo code in payload, using default demo code",
        )
        // Set a default demo code if somehow it's missing
        payload.demoCode = `
          import React from 'react';
          export default function Demo() {
            return <div className="p-4">Demo component</div>;
          }
        `
      }

      console.log("[compileCSS] Request payload keys:", Object.keys(payload))
      console.log(
        "[compileCSS] Demo code included in payload:",
        !!payload.demoCode,
      )
      console.log(
        "[compileCSS] Demo code length in payload:",
        payload.demoCode.length,
      )

      // Full URL for debugging
      const fullUrl = `${backendUrl}/compile-css`
      console.log("[compileCSS] Full URL:", fullUrl)

      // Make the request with detailed error handling
      console.log("[compileCSS] Sending request now...")

      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      console.log("[compileCSS] Response status:", response.status)

      if (!response.ok) {
        console.error(
          `[compileCSS] Server error: ${response.status} ${response.statusText}`,
        )
        throw new Error(
          `Server responded with ${response.status}: ${response.statusText}`,
        )
      }

      const data = await response.json()
      if (data.error) {
        console.error("[compileCSS] CSS compilation failed:", {
          error: data.error,
          details: data.details,
        })
        toast.error(`CSS compilation failed: ${data.details || data.error}`)
        // Default CSS is already set above
      } else {
        console.log(
          "[compileCSS] CSS compiled successfully, length:",
          data.css.length,
        )
        setCompiledCss(data.css)
      }
      setIsCssCompiling(false)
    } catch (error) {
      console.error("[compileCSS] Failed to compile CSS:", error)
      console.log("[compileCSS] Using default CSS instead")
      // Default CSS is already set above
      setIsCssCompiling(false)
    }
  }, [
    componentCode,
    processedData,
    registryDependencies,
    files,
    mergedTailwindConfig,
    mergedGlobalCss,
    getComponentFilePath,
    isCssCompiling,
    generateStylesCss,
  ])

  // Force recompilation when demo file changes
  const triggerDemoRecompilation = useCallback(() => {
    console.log(
      "[triggerDemoRecompilation] Forcing recompilation due to demo changes",
    )

    // Clear any existing timeout
    if (cssCompileTimeoutRef.current) {
      clearTimeout(cssCompileTimeoutRef.current)
      cssCompileTimeoutRef.current = null
    }

    // Force update the hash reference to ensure we detect the change
    prevFilesHashRef.current = ""

    // Schedule immediate recompilation
    setTimeout(() => {
      lastCompilationTimeRef.current = Date.now()
      compileCSS()
    }, 300)
  }, [compileCSS])

  // Set up the effect to trigger CSS compilation when files change
  useEffect(() => {
    // Don't compile if we're still processing the component
    if (isProcessing || !processedData) return

    // Generate a hash of all key files to detect changes
    const currentFilesHash = generateFilesHash()

    // Check specifically for demo file changes
    const demoFile = files["/demo.tsx"]
    const demoContent =
      typeof demoFile === "string" ? demoFile : demoFile?.code || ""
    const demoChanged = demoContent !== lastDemoContentRef.current

    if (demoChanged) {
      console.log(
        "[useEffect] Demo file changed directly! Length:",
        demoContent.length,
      )
      lastDemoContentRef.current = demoContent

      // Skip debounce for demo changes - compile more aggressively
      if (cssCompileTimeoutRef.current) {
        clearTimeout(cssCompileTimeoutRef.current)
      }

      // Trigger immediate compilation for demo changes
      cssCompileTimeoutRef.current = setTimeout(() => {
        prevFilesHashRef.current = currentFilesHash
        lastCompilationTimeRef.current = Date.now()
        compileCSS()
        cssCompileTimeoutRef.current = null
      }, 500) // Faster debounce for demo changes

      return
    }

    // Normal debounce logic for other changes
    // Don't recompile if no files have changed and it was recently compiled
    if (
      currentFilesHash === prevFilesHashRef.current &&
      Date.now() - lastCompilationTimeRef.current < 5000
    ) {
      console.log(
        "[compileCSS] Skipping - no files have changed since last compilation",
      )
      return
    }

    // Don't compile if a compilation is already in progress
    if (isCssCompiling) {
      console.log("[compileCSS] Skipping - compilation already in progress")
      return
    }

    // Clear any existing timeout
    if (cssCompileTimeoutRef.current) {
      clearTimeout(cssCompileTimeoutRef.current)
    }

    console.log("[compileCSS] Files have changed, scheduling compilation")

    // Set a new timeout to debounce the compilation
    cssCompileTimeoutRef.current = setTimeout(() => {
      // Update the hash reference before compilation
      prevFilesHashRef.current = currentFilesHash
      lastCompilationTimeRef.current = Date.now()
      compileCSS()
      cssCompileTimeoutRef.current = null
    }, 1000) // Debounce for 1 second

    // Cleanup timeout on unmount
    return () => {
      if (cssCompileTimeoutRef.current) {
        clearTimeout(cssCompileTimeoutRef.current)
      }
    }
  }, [
    files,
    processedData,
    isProcessing,
    registryDependencies,
    compileCSS,
    isCssCompiling,
    generateFilesHash,
  ])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (cssCompileTimeoutRef.current) {
        clearTimeout(cssCompileTimeoutRef.current)
      }
    }
  }, [])

  return {
    compiledCss,
    isCssCompiling,
    generateStylesCss,
    forceRecompile: triggerDemoRecompilation,
  }
}
