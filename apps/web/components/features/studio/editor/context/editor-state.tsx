import React, { createContext, useContext, useEffect } from "react"
import { useAtom } from "jotai"
import { useSandpack } from "@codesandbox/sandpack-react"

// Import types
import {
  CodeManagerContextType,
  CodeManagerProviderProps,
} from "./editor-types"

// Import atoms
import {
  activeFileAtom,
  userModifiedFilesAtom,
  loadingComponentsAtom,
} from "./editor-atoms"

// Import hooks
import { useActionRequired } from "../hooks/use-action-required"
import { usePreviewReady } from "../hooks/use-preview-ready"

// Create the context
const CodeManagerContext = createContext<CodeManagerContextType | null>(null)

/**
 * Hook to access the CodeManager context
 */
export function useCodeManager() {
  const context = useContext(CodeManagerContext)
  if (!context) {
    throw new Error("useCodeManager must be used within a CodeManagerProvider")
  }
  return context
}

// Re-export hooks and types
export { useEditorFile } from "../hooks/use-editor-file"
export { useActionRequired } from "../hooks/use-action-required"
export { usePreviewReady } from "../hooks/use-preview-ready"
export type {
  ActionRequiredDetails,
  ActionRequiredReason,
  StylesActionDetails,
  UnresolvedDependenciesActionDetails,
  OtherActionDetails,
} from "./editor-types"

/**
 * CodeManager Provider Component
 */
export function CodeManagerProvider({
  children,
  initialComponentPath,
  unresolvedDependencies = [],
  onFileContentChange,
  isUnknownComponentFn = () => false,
}: CodeManagerProviderProps) {
  // Safely try to access Sandpack - will fail gracefully outside of SandpackProvider
  let sandpack = null
  try {
    sandpack = useSandpack().sandpack
  } catch (error) {
    // Outside of SandpackProvider context, continue without Sandpack features
  }

  const [activeFile, setActiveFile] = useAtom(activeFileAtom)
  const [userModifiedFiles, setUserModifiedFiles] = useAtom(
    userModifiedFilesAtom,
  )
  const [loadingComponents, setLoadingComponents] = useAtom(
    loadingComponentsAtom,
  )

  // Get action required functions from the hook instead of redefining them
  const {
    actionRequiredFiles,
    actionRequiredPaths,
    markFileAsRequiringAction,
    markFileAsResolved,
    isActionRequired,
    getActionDetails,
  } = useActionRequired()

  // Get preview ready functions from the hook
  const { previewReady, markPreviewReady, markPreviewNotReady } =
    usePreviewReady()

  // Watch for demo.tsx file changes to automatically set preview ready state
  useEffect(() => {
    if (!sandpack) return // Skip if outside of SandpackProvider

    const demoFile = sandpack.files["/demo.tsx"]
    if (
      demoFile &&
      demoFile.code &&
      demoFile.code !== "// Add your demo code here"
    ) {
      markPreviewReady()
    }
  }, [sandpack?.files, markPreviewReady, sandpack])

  // Initialize with the main component file
  useEffect(() => {
    if (initialComponentPath && !activeFile && sandpack) {
      selectFile(initialComponentPath)
    }
  }, [initialComponentPath, sandpack, activeFile])

  // File selection
  const selectFile = (path: string | null) => {
    if (!path) {
      setActiveFile(null)
      return
    }

    console.log("[CodeManager] Selecting file:", {
      path,
      isUnknown: isUnknownComponentFn(path),
      activeFiles: sandpack ? Object.keys(sandpack.files) : [],
      currentActiveFile: sandpack?.activeFile,
    })

    // Only update Sandpack if it's not an unknown component and sandpack is available
    if (!isUnknownComponentFn(path) && sandpack) {
      console.log("[CodeManager] Setting Sandpack active file:", path)
      sandpack.setActiveFile(path)
    } else if (isUnknownComponentFn(path)) {
      console.log(
        "[CodeManager] Unknown component - not setting in Sandpack:",
        path,
      )
    }

    // Update atom state
    setActiveFile(path)
    console.log("[CodeManager] Updated active file in atom state:", path)
  }

  // File content operations
  const getFileContent = (path: string) => {
    return sandpack ? sandpack.files[path]?.code : undefined
  }

  const updateFileContent = (path: string, content: string) => {
    // Check if the content is actually different
    const currentContent = getFileContent(path)
    if (currentContent === content) {
      return
    }

    // Mark this file as user-modified in atom state
    setUserModifiedFiles((prev) => ({ ...prev, [path]: true }))

    // Update sandpack if available
    if (sandpack) {
      sandpack.updateFile(path, content)
    }

    // Mark preview ready if demo.tsx is edited
    if (path === "/demo.tsx" && content !== "// Add your demo code here") {
      markPreviewReady()
    }

    // Notify parent if needed
    if (onFileContentChange) {
      onFileContentChange(path, content)
    }
  }

  const addFile = (path: string, content: string = "") => {
    if (sandpack) {
      sandpack.addFile(path, content)
    }

    // Select the newly created file
    selectFile(path)
  }

  const renameFile = (from: string, to: string) => {
    // Get the file content if sandpack is available
    if (!sandpack) return

    const fileObj = sandpack.files[from]

    // Proceed only if we have a file to rename
    if (fileObj) {
      // Handle both string content and SandpackFile objects
      const content = typeof fileObj === "string" ? fileObj : fileObj.code || ""

      // Create new file with the content
      sandpack.addFile(to, content)

      // Transfer user modification state
      if (userModifiedFiles[from]) {
        setUserModifiedFiles((prev) => {
          const newState = { ...prev }
          delete newState[from]
          newState[to] = true
          return newState
        })
      }

      // Remove old file
      deleteFile(from)

      // Update active file if needed
      if (activeFile === from) {
        selectFile(to)
      }
    }
  }

  const deleteFile = (path: string) => {
    // Remove from Sandpack if available
    if (sandpack) {
      sandpack.deleteFile(path)
    }

    // Remove from user modified tracking
    if (userModifiedFiles[path]) {
      setUserModifiedFiles((prev) => {
        const newState = { ...prev }
        delete newState[path]
        return newState
      })
    }

    // Update active file if needed
    if (activeFile === path) {
      // Select another file
      if (sandpack) {
        const files = Object.keys(sandpack.files)
        if (files.length > 0 && files[0]) {
          selectFile(files[0])
        } else {
          setActiveFile(null)
        }
      } else {
        setActiveFile(null)
      }
    }
  }

  // Component utilities
  const isUnresolvedDependency = (path: string) => {
    // Check if it's marked as a file with unresolved_dependencies
    const details = getActionDetails(path)
    return (
      details?.reason === "unresolved_dependencies" &&
      details.componentName !== undefined
    )
  }

  // Update unresolvedDependencies to use the action system
  useEffect(() => {
    if (unresolvedDependencies && unresolvedDependencies.length > 0) {
      // Register unknown components as files requiring action with unresolved_dependencies reason
      unresolvedDependencies.forEach((comp) => {
        markFileAsRequiringAction(comp.path, {
          reason: "unresolved_dependencies",
          message: `Missing import for component: ${comp.name || "Unnamed"}`,
          componentName: comp.name,
        })
      })
    }
  }, [unresolvedDependencies, markFileAsRequiringAction])

  const getComponentName = (path: string) => {
    // First check in action required files for unresolved_dependencies reason with componentName
    const actionDetails = getActionDetails(path)
    if (
      actionDetails?.reason === "unresolved_dependencies" &&
      actionDetails.componentName
    ) {
      return actionDetails.componentName
    }
    // Fallback to old method
    return unresolvedDependencies?.find((comp) => comp.path === path)?.name
  }

  // The context now just passes through the atom state + operations
  const value: CodeManagerContextType = {
    // File operations
    getFileContent,
    updateFileContent,
    addFile,
    renameFile,
    deleteFile,

    // File state
    activeFile, // From atom
    selectFile, // Updates atom

    // File types and management
    isUnresolvedDependency,
    getComponentName,

    // File metadata
    allFiles: sandpack ? Object.keys(sandpack.files) : [],
    unresolvedDependencies,

    // Loading state
    loadingComponents,
    setLoadingComponents,

    // Action required state - using functions from the hook
    actionRequiredFiles,
    actionRequiredPaths,
    markFileAsRequiringAction,
    markFileAsResolved,
    isActionRequired,
    getActionDetails,

    // Preview ready state
    previewReady,
    markPreviewReady,
    markPreviewNotReady,
  }

  return (
    <CodeManagerContext.Provider value={value}>
      {children}
    </CodeManagerContext.Provider>
  )
}
