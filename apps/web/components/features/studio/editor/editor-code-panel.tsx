import React, { useEffect, useRef, useCallback, useMemo } from "react"
import {
  SandpackCodeEditor,
  useActiveCode,
  useSandpack,
} from "@codesandbox/sandpack-react"
import { useCodeManager, useActionRequired } from "./context/editor-state"

// Create a persistent file content cache that survives component remounts
const globalFileContentCache = new Map<string, string>()

// Memoize the SandpackCodeEditor to prevent unnecessary re-renders
const MemoizedSandpackCodeEditor = React.memo(SandpackCodeEditor)

interface EditorCodePanelProps {
  onCodeChange?: (code: string) => void
  componentPath: string
}

// Wrap the EditorCodePanel in React.memo for additional performance
export const EditorCodePanel = React.memo(function EditorCodePanel({
  onCodeChange,
  componentPath,
}: EditorCodePanelProps) {
  const { code } = useActiveCode()
  const { sandpack } = useSandpack()
  const prevCodeRef = useRef<string>(undefined)
  const updatingRef = useRef(false)
  const initialCodeRef = useRef<string | null>(null)
  const { markFileAsResolved, isActionRequired, getActionDetails } =
    useActionRequired()

  // Add logging to track component rendering with active path
  console.log("[EditorCodePanel] Rendering with:", {
    componentPath,
    sandpackActiveFile: sandpack.activeFile,
    fileExistsInSandpack: componentPath
      ? !!sandpack.files[componentPath]
      : false,
    hasCode: !!code,
  })

  let codeManager
  try {
    codeManager = useCodeManager()
  } catch (error) {
    codeManager = null
  }

  // Normalize the path - only compute this once per componentPath change
  const normalizedPath = useMemo(
    () => componentPath.replace(/^@\//, "/"),
    [componentPath],
  )

  // Check if this is an unknown component that needs action - memoize this value
  const isUnresolvedDependency = useMemo(
    () => codeManager?.isUnresolvedDependency?.(componentPath) || false,
    [codeManager, componentPath],
  )

  // Store the initial code value for comparison
  useEffect(() => {
    if (code && !initialCodeRef.current) {
      initialCodeRef.current = code
    }
  }, [code])

  // Handle file restoration or creation - use useCallback for better performance
  const handleFileMissing = useCallback(() => {
    if (!normalizedPath || sandpack.files[normalizedPath]) return

    console.log("[EditorCodePanel] File missing check:", {
      normalizedPath,
      fileExists: !!sandpack.files[normalizedPath],
      hasCachedContent: globalFileContentCache.has(normalizedPath),
      isUnresolvedDependency,
      activeFile: sandpack.activeFile,
    })

    // Check if we have cached content for this file
    const cachedContent = globalFileContentCache.get(normalizedPath)

    if (cachedContent) {
      try {
        console.log(
          "[EditorCodePanel] Restoring file from cache:",
          normalizedPath,
        )
        // Restore the file with cached content
        sandpack.addFile(normalizedPath, cachedContent)

        // Set as active file
        sandpack.setActiveFile(normalizedPath)

        // Update the code manager if available
        if (codeManager?.addFile) {
          codeManager.addFile(normalizedPath, cachedContent)
        }
      } catch (error) {
        console.error("[EditorCodePanel] Failed to restore file:", error)
      }
    } else if (codeManager) {
      try {
        console.log("[EditorCodePanel] Creating new file:", normalizedPath)
        // Create the file with placeholder content
        const defaultContent = "// TODO: Implement this component"
        sandpack.addFile(normalizedPath, defaultContent)

        // Set as active file
        sandpack.setActiveFile(normalizedPath)

        // Update the code manager if available
        if (codeManager.addFile) {
          codeManager.addFile(normalizedPath, defaultContent)
        }

        // Add to cache
        globalFileContentCache.set(normalizedPath, defaultContent)
        console.log(
          "[EditorCodePanel] File created and cached:",
          normalizedPath,
        )
      } catch (error) {
        console.error("[EditorCodePanel] Failed to create file:", error)
      }
    }
  }, [normalizedPath, sandpack, codeManager, isUnresolvedDependency])

  useEffect(() => {
    // If the file doesn't exist and we have a valid path, create it or restore it
    handleFileMissing()

    // Create a stable interval that checks for file existence periodically
    // This helps ensure the file is restored if it gets deleted during component lifecycle
    const intervalId = setInterval(() => {
      if (normalizedPath && !sandpack.files[normalizedPath]) {
        handleFileMissing()
      }
    }, 1000)

    return () => clearInterval(intervalId)
  }, [
    normalizedPath,
    sandpack.activeFile,
    sandpack.files,
    isUnresolvedDependency,
    handleFileMissing,
  ])

  // Handle code updates and cache code
  const handleCodeUpdate = useCallback(() => {
    if (updatingRef.current || prevCodeRef.current === code || !code) {
      return
    }

    prevCodeRef.current = code

    if (sandpack.activeFile === normalizedPath) {
      // Cache the file content to prevent loss on remounts
      globalFileContentCache.set(normalizedPath, code)

      // Check both path formats (with and without @/ prefix)
      const pathWithPrefix = `@${normalizedPath}`

      // Automatically resolve any "unresolved_dependencies" action required status
      // when file content changes, regardless of content - check both path formats
      const checkAndResolveActionRequired = (path: string) => {
        if (isActionRequired(path)) {
          const actionDetails = getActionDetails(path)
          if (
            actionDetails &&
            actionDetails.reason === "unresolved_dependencies"
          ) {
            markFileAsResolved(path)
          }
        }
      }

      // Check both path formats
      checkAndResolveActionRequired(normalizedPath)
      checkAndResolveActionRequired(pathWithPrefix)

      if (codeManager && normalizedPath) {
        try {
          updatingRef.current = true
          codeManager.updateFileContent(normalizedPath, code)
          setTimeout(() => {
            updatingRef.current = false
          }, 50)
        } catch (error) {
          console.error("[EditorCodePanel] Error updating file content", error)
          updatingRef.current = false
        }
      }

      if (onCodeChange) {
        onCodeChange(code)
      }
    }
  }, [
    code,
    onCodeChange,
    sandpack.activeFile,
    componentPath,
    normalizedPath,
    codeManager,
    markFileAsResolved,
    isUnresolvedDependency,
    isActionRequired,
    getActionDetails,
  ])

  // Call the update handler when code changes
  useEffect(() => {
    handleCodeUpdate()
  }, [handleCodeUpdate])

  // Memoize props for SandpackCodeEditor to prevent unnecessary re-renders
  const editorProps = useMemo(
    () => ({
      showTabs: false,
      showLineNumbers: true,
      showInlineErrors: true,
      className: "h-full",
      style: { height: "100%" },
      initMode: "immediate" as const,
    }),
    [],
  )

  return <MemoizedSandpackCodeEditor {...editorProps} />
})

interface SimpleEditorProps {
  onChange?: (code: string) => void
}

export function SimpleEditor({ onChange }: SimpleEditorProps) {
  const { code } = useActiveCode()

  useEffect(() => {
    if (onChange && code) {
      onChange(code)
    }
  }, [code, onChange])

  return (
    <SandpackCodeEditor
      showTabs={false}
      showLineNumbers={true}
      showInlineErrors={true}
      className="h-full"
      style={{ height: "100%" }}
    />
  )
}
