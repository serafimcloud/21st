import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSandpack } from "@codesandbox/sandpack-react"

// Define the types for our context
interface CodeManagerContextType {
  // File operations
  getFileContent: (path: string) => string | undefined
  updateFileContent: (path: string, content: string) => void
  addFile: (path: string, content: string) => void
  renameFile: (from: string, to: string) => void
  deleteFile: (path: string) => void

  // File state
  activeFile: string | null
  selectFile: (path: string) => void

  // File types and management
  isUnknownComponent: (path: string) => boolean
  getComponentName: (path: string) => string | undefined

  // File metadata
  allFiles: string[]
  nonShadcnComponents: Array<{ name: string; path: string }> | undefined
}

const CodeManagerContext = createContext<CodeManagerContextType | null>(null)

export function useCodeManager() {
  const context = useContext(CodeManagerContext)
  if (!context) {
    throw new Error("useCodeManager must be used within a CodeManagerProvider")
  }
  return context
}

interface CodeManagerProviderProps {
  children: React.ReactNode
  initialComponentPath: string
  nonShadcnComponents?: Array<{ name: string; path: string }>
  onFileContentChange?: (path: string, content: string) => void
  isUnknownComponentFn?: (path: string) => boolean
}

export function CodeManagerProvider({
  children,
  initialComponentPath,
  nonShadcnComponents = [],
  onFileContentChange,
  isUnknownComponentFn = () => false,
}: CodeManagerProviderProps) {
  const { sandpack } = useSandpack()
  const [activeFile, setActiveFile] = useState<string | null>(
    initialComponentPath,
  )
  const [userModifiedFiles, setUserModifiedFiles] = useState<
    Record<string, boolean>
  >({})
  const router = useRouter()

  // Initialize with the main component file
  useEffect(() => {
    if (initialComponentPath && !activeFile) {
      selectFile(initialComponentPath)
    }
  }, [initialComponentPath])

  // Log state changes in development
  useEffect(() => {
    console.log("[CodeManager] Current state:", {
      activeFile,
      files: Object.keys(sandpack.files),
      userModifiedFiles,
    })
  }, [sandpack.files, activeFile, userModifiedFiles])

  // File selection
  const selectFile = (path: string) => {
    if (!path) return

    console.log("[CodeManager] Selecting file:", path)

    // Only update Sandpack if it's not an unknown component
    if (!isUnknownComponentFn(path)) {
      sandpack.setActiveFile(path)
    }

    setActiveFile(path)
  }

  // File content operations
  const getFileContent = (path: string) => {
    return sandpack.files[path]?.code
  }

  const updateFileContent = (path: string, content: string) => {
    console.log("[CodeManager] Updating file content:", path)

    // Mark this file as user-modified
    setUserModifiedFiles((prev) => ({ ...prev, [path]: true }))

    sandpack.updateFile(path, content)

    // Notify parent if needed
    if (onFileContentChange) {
      onFileContentChange(path, content)
    }
  }

  const addFile = (path: string, content: string = "") => {
    console.log("[CodeManager] Adding new file:", path)

    sandpack.addFile(path, content)

    // Select the newly created file
    selectFile(path)
  }

  const renameFile = (from: string, to: string) => {
    console.log("[CodeManager] Renaming file:", { from, to })

    // Get the file content
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
    } else {
      console.warn(`[CodeManager] Cannot rename file: File not found ${from}`)
    }
  }

  const deleteFile = (path: string) => {
    console.log("[CodeManager] Deleting file:", path)

    // Remove from Sandpack
    sandpack.deleteFile(path)

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
      const files = Object.keys(sandpack.files)
      if (files.length > 0) {
        selectFile(files[0] as string)
      } else {
        setActiveFile(null)
      }
    }
  }

  // Component utilities
  const isUnknownComponent = (path: string) => {
    return isUnknownComponentFn(path)
  }

  const getComponentName = (path: string) => {
    return nonShadcnComponents?.find((comp) => comp.path === path)?.name
  }

  const value: CodeManagerContextType = {
    // File operations
    getFileContent,
    updateFileContent,
    addFile,
    renameFile,
    deleteFile,

    // File state
    activeFile,
    selectFile,

    // File types and management
    isUnknownComponent,
    getComponentName,

    // File metadata
    allFiles: Object.keys(sandpack.files),
    nonShadcnComponents,
  }

  return (
    <CodeManagerContext.Provider value={value}>
      {children}
    </CodeManagerContext.Provider>
  )
}
