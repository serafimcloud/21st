import React, { createContext, useContext, useEffect, useCallback } from "react"
import { atom, useAtom } from "jotai"
import { useSandpack } from "@codesandbox/sandpack-react"

// Define atoms for state management (single source of truth)
export const activeFileAtom = atom<string | null>(null)
export const userModifiedFilesAtom = atom<Record<string, boolean>>({})
export const loadingComponentsAtom = atom<string[]>([])
export const previewReadyAtom = atom<boolean>(false)

// New atom for files requiring action
export interface ActionRequiredDetails {
  reason: "styles" | "missing_import" | "other"
  message?: string
  tailwindExtensions?: Record<string, any>
  cssVariables?: Array<any>
  keyframes?: Array<any>
  utilities?: Array<any>
  componentName?: string
}

export const actionRequiredFilesAtom = atom<
  Record<string, ActionRequiredDetails>
>({})

// Define the types for our context
interface CodeManagerContextType {
  // File operations
  getFileContent: (path: string) => string | undefined
  updateFileContent: (path: string, content: string) => void
  addFile: (path: string, content: string) => void
  renameFile: (oldPath: string, newPath: string) => void
  deleteFile: (path: string) => void

  // File state
  activeFile: string | null
  selectFile: (path: string | null) => void

  // File types and management
  isUnknownComponent: (path: string) => boolean
  getComponentName: (path: string) => string | undefined

  // File metadata
  allFiles: string[]
  unresolvedDependencies: Array<{ name: string; path: string }> | undefined

  // Loading state
  loadingComponents: string[]
  setLoadingComponents: (paths: string[]) => void

  // Action required state
  actionRequiredFiles: Record<string, ActionRequiredDetails>
  markFileAsRequiringAction: (
    path: string,
    details: ActionRequiredDetails,
  ) => void
  markFileAsResolved: (path: string) => void
  isActionRequired: (path: string) => boolean
  getActionDetails: (path: string) => ActionRequiredDetails | undefined

  // Preview ready state
  previewReady: boolean
  markPreviewReady: () => void
  markPreviewNotReady: () => void
}

const CodeManagerContext = createContext<CodeManagerContextType | null>(null)

export function useCodeManager() {
  const context = useContext(CodeManagerContext)
  if (!context) {
    throw new Error("useCodeManager must be used within a CodeManagerProvider")
  }
  return context
}

// Simple hook to access atom state directly
export function useEditorFile() {
  const [activeFile, setActiveFile] = useAtom(activeFileAtom)
  const [userModifiedFiles] = useAtom(userModifiedFilesAtom)

  return {
    activeFile,
    setActiveFile,
    isFileModified: (path: string) => userModifiedFiles[path] || false,
  }
}

// New hook to access action required state directly
export function useActionRequired() {
  const [actionRequiredFiles, setActionRequiredFiles] = useAtom(
    actionRequiredFilesAtom,
  )

  const markFileAsRequiringAction = useCallback(
    (path: string, details: ActionRequiredDetails) => {
      setActionRequiredFiles((prev) => {
        // Skip update if nothing is changing to prevent loops
        if (
          prev[path] &&
          JSON.stringify(prev[path]) === JSON.stringify(details)
        ) {
          return prev
        }

        return {
          ...prev,
          [path]: details,
        }
      })
    },
    [setActionRequiredFiles],
  )

  const markFileAsResolved = useCallback(
    (path: string) => {
      setActionRequiredFiles((prev) => {
        // Skip update if file isn't in the list to prevent unnecessary renders
        if (!prev[path]) {
          return prev
        }

        const next = { ...prev }
        delete next[path]
        return next
      })
    },
    [setActionRequiredFiles],
  )

  const isActionRequired = useCallback(
    (path: string) => {
      return !!actionRequiredFiles[path]
    },
    [actionRequiredFiles],
  )

  const getActionDetails = useCallback(
    (path: string) => {
      return actionRequiredFiles[path]
    },
    [actionRequiredFiles],
  )

  return {
    actionRequiredFiles,
    markFileAsRequiringAction,
    markFileAsResolved,
    isActionRequired,
    getActionDetails,
  }
}

// New hook to manage preview readiness that doesn't depend on Sandpack
export function usePreviewReady() {
  const [previewReady, setPreviewReady] = useAtom(previewReadyAtom)

  const markPreviewReady = useCallback(() => {
    setPreviewReady(true)
  }, [setPreviewReady])

  const markPreviewNotReady = useCallback(() => {
    setPreviewReady(false)
  }, [setPreviewReady])

  return {
    previewReady,
    markPreviewReady,
    markPreviewNotReady,
  }
}

interface CodeManagerProviderProps {
  children: React.ReactNode
  initialComponentPath: string
  unresolvedDependencies?: Array<{ name: string; path: string }>
  onFileContentChange?: (path: string, content: string) => void
  isUnknownComponentFn?: (path: string) => boolean
}

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
  }, [initialComponentPath, sandpack])

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
  const isUnknownComponent = (path: string) => {
    // Check if it's marked as a file with missing_import
    const details = getActionDetails(path)
    return (
      details?.reason === "missing_import" &&
      details.componentName !== undefined
    )
  }

  // Update unresolvedDependencies to use the action system
  useEffect(() => {
    if (unresolvedDependencies && unresolvedDependencies.length > 0) {
      // Register unknown components as files requiring action with missing_import reason
      unresolvedDependencies.forEach((comp) => {
        markFileAsRequiringAction(comp.path, {
          reason: "missing_import",
          message: `Missing import for component: ${comp.name || "Unnamed"}`,
          componentName: comp.name,
        })
      })
    }
  }, [unresolvedDependencies, markFileAsRequiringAction])

  const getComponentName = (path: string) => {
    // First check in action required files for missing_import reason with componentName
    const actionDetails = getActionDetails(path)
    if (
      actionDetails?.reason === "missing_import" &&
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
    isUnknownComponent,
    getComponentName,

    // File metadata
    allFiles: sandpack ? Object.keys(sandpack.files) : [],
    unresolvedDependencies,

    // Loading state
    loadingComponents,
    setLoadingComponents,

    // Action required state - using functions from the hook
    actionRequiredFiles,
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
