import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"
import { defaultGlobalCss, defaultTailwindConfig } from "@/lib/defaults"
import type { SandpackFiles } from "@codesandbox/sandpack-react"
import { useSandpack } from "@codesandbox/sandpack-react"

interface UseCssCompilerProps {
  componentCode: string
  processedData: any | null
  isProcessing: boolean
  registryDependencies: Record<string, { code: string; registry: string }>
  files: SandpackFiles
  globalCss: string
  tailwindConfig: string
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
  globalCss,
  tailwindConfig,
  getComponentFilePath,
}: UseCssCompilerProps) {
  // State for tracking compilation
  const [compiledCss, setCompiledCss] = useState<string | null>(null)
  const [isCssCompiling, setIsCssCompiling] = useState(false)

  // Refs for tracking and debouncing
  const cssCompileTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastCompilationTimeRef = useRef<number>(0)
  const lastDemoContentRef = useRef<string>("")

  // Get Sandpack context - may be undefined if outside Sandpack provider
  let sandpack: any = null
  try {
    sandpack = useSandpack().sandpack
  } catch (error) {
    // Outside of SandpackProvider context, continue without Sandpack features
  }

  // Helper function to generate basic styles.css as fallback
  const generateStylesCss = useCallback(() => {
    return defaultGlobalCss
  }, [])

  // Update styles.css file using BOTH methods - direct files update and Sandpack API
  const updateStylesFile = useCallback(
    (css: string) => {
      if (!css) return false

      console.log(
        "[useCssCompiler] Updating styles.css file, content length:",
        css.length,
      )

      // Method 1: Direct update to files object
      if (files) {
        if (typeof files["/styles.css"] === "string") {
          files["/styles.css"] = css
        } else {
          files["/styles.css"] = { code: css }
        }
      }

      // Method 2: Using Sandpack API if available
      if (sandpack) {
        try {
          console.log("[useCssCompiler] Updating styles.css via Sandpack API")
          sandpack.updateFile("/styles.css", css)
        } catch (error) {
          console.error(
            "[useCssCompiler] Error updating file via Sandpack:",
            error,
          )
        }
      }

      return true
    },
    [files, sandpack],
  )

  // The main CSS compilation function
  const compileCSS = useCallback(async () => {
    if (!componentCode || !processedData) {
      console.log("[compileCSS] Missing component code or processed data")
      return
    }

    if (isCssCompiling) {
      console.log("[compileCSS] Compilation already in progress")
      return
    }

    console.log("[compileCSS] Starting CSS compilation")
    setIsCssCompiling(true)

    // Set default CSS as fallback
    const defaultCss = generateStylesCss()
    setCompiledCss(defaultCss)

    // Apply default CSS to styles.css right away
    updateStylesFile(defaultCss)

    // Check if backend URL is available
    const backendUrl = process.env.NEXT_PUBLIC_COMPILE_CSS_URL
    if (!backendUrl) {
      console.log("[compileCSS] Backend URL not available, using default CSS")
      setIsCssCompiling(false)
      return
    }

    try {
      // Get component path
      const componentPath = getComponentFilePath()

      // Get demo code
      const demoFile = files["/demo.tsx"]
      const demoCode =
        typeof demoFile === "string" ? demoFile : demoFile?.code || ""

      console.log("[compileCSS] Demo code length:", demoCode.length)

      // Extract registry dependencies
      const registryDependenciesArray = Object.entries(
        registryDependencies || {},
      ).map(([_, item]) => (typeof item === "string" ? item : item.code))

      // Generate shell code from all JS/TS files
      const shellCode = Object.entries(files)
        .filter(([key]) => /\.(tsx|jsx|ts|js)$/.test(key))
        .map(([_, value]) => (typeof value === "string" ? value : value.code))

      // Ensure demo.tsx is included
      const demoInShellCode = shellCode.some(
        (code) =>
          code.includes("export default function Demo()") ||
          code.includes("Demo components loaded"),
      )

      if (!demoInShellCode && demoCode) {
        shellCode.push(demoCode)
      }

      // Combine all dependencies
      const allDependencies = [...registryDependenciesArray, ...shellCode]

      // Prepare request payload
      const payload = {
        code: componentCode,
        demoCode,
        baseTailwindConfig: defaultTailwindConfig,
        baseGlobalCss: defaultGlobalCss,
        customTailwindConfig: tailwindConfig,
        customGlobalCss: globalCss,
        dependencies: allDependencies,
      }

      // Send request to compile CSS
      const response = await fetch(`${backendUrl}/compile-css`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      if (data.error) {
        console.error("[compileCSS] CSS compilation failed:", data.error)
        toast.error(`CSS compilation failed: ${data.details || data.error}`)
      } else {
        console.log(
          "[compileCSS] CSS compiled successfully:",
          data.css.length,
          "bytes",
        )

        // Update the state
        setCompiledCss(data.css)

        // Update the styles.css file directly
        updateStylesFile(data.css)
      }
    } catch (error) {
      console.error("[compileCSS] Error during compilation:", error)
      if (error instanceof Error) {
        toast.error(`Failed to compile CSS: ${error.message}`)
      }
    } finally {
      setIsCssCompiling(false)
      lastCompilationTimeRef.current = Date.now()
    }
  }, [
    componentCode,
    processedData,
    isProcessing,
    registryDependencies,
    files,
    tailwindConfig,
    globalCss,
    getComponentFilePath,
    generateStylesCss,
    isCssCompiling,
    updateStylesFile,
  ])

  // Check for demo.tsx changes and trigger recompilation if needed
  const checkDemoChanges = useCallback(() => {
    const demoFile = files["/demo.tsx"]
    if (!demoFile) return false

    const currentDemoContent =
      typeof demoFile === "string" ? demoFile : demoFile.code || ""

    // Check if content has changed
    if (currentDemoContent !== lastDemoContentRef.current) {
      console.log(
        "[useCssCompiler] Demo file content changed, triggering recompilation",
      )
      lastDemoContentRef.current = currentDemoContent
      return true
    }

    return false
  }, [files])

  // Force recompilation on demand (used by external components)
  const triggerRecompilation = useCallback(() => {
    console.log("[useCssCompiler] Force recompilation requested")

    // Clear any existing timeout
    if (cssCompileTimeoutRef.current) {
      clearTimeout(cssCompileTimeoutRef.current)
      cssCompileTimeoutRef.current = null
    }

    // Reset tracking for demo content
    lastDemoContentRef.current = ""

    // Schedule immediate recompilation
    setTimeout(() => {
      compileCSS()
    }, 300)
  }, [compileCSS])

  // Effect to watch for changes and trigger compilation
  useEffect(() => {
    // Skip if still processing or no data
    if (isProcessing || !processedData) return

    // Check demo changes
    const demoChanged = checkDemoChanges()

    // Skip if compilation in progress
    if (isCssCompiling) return

    // Skip if recently compiled (within 5 seconds) and no demo change
    if (!demoChanged && Date.now() - lastCompilationTimeRef.current < 5000)
      return

    // Clear existing timeout
    if (cssCompileTimeoutRef.current) {
      clearTimeout(cssCompileTimeoutRef.current)
    }

    // Set timeout with appropriate delay
    const delay = demoChanged ? 500 : 1000
    cssCompileTimeoutRef.current = setTimeout(() => {
      compileCSS()
      cssCompileTimeoutRef.current = null
    }, delay)

    // Cleanup on unmount
    return () => {
      if (cssCompileTimeoutRef.current) {
        clearTimeout(cssCompileTimeoutRef.current)
      }
    }
  }, [
    files,
    processedData,
    isProcessing,
    isCssCompiling,
    compileCSS,
    checkDemoChanges,
  ])

  // Ensure styles.css is always up to date with compiled CSS
  useEffect(() => {
    if (compiledCss) {
      updateStylesFile(compiledCss)
    }
  }, [compiledCss, updateStylesFile])

  // Return the necessary values and functions
  return {
    compiledCss,
    isCssCompiling,
    generateStylesCss,
    forceRecompile: triggerRecompilation,
  }
}
