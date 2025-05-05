import { SandpackLayout, useSandpack } from "@codesandbox/sandpack-react"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { FileExplorer } from "./file-explorer"
import { EditorCodePanel } from "./editor-code-panel"
import { RequirementsPanel } from "./requirements-panel"
import { useActionRequired } from "./context/editor-state"
import { ActionRequiredDetails } from "./context/editor-types"

interface SandpackInitialContentProps {
  activePreview: {
    type: "regular" | "unknown"
    filePath: string
    componentName?: string
  } | null
  onPreviewSelect: (preview: {
    type: "regular" | "unknown"
    filePath: string
    componentName?: string
  }) => void
  unresolvedDependencies?: Array<{ name: string; path: string }>
  getComponentFilePath: () => string
  setComponentCode: (code: string) => void
  isUnresolvedDependency: (path: string) => boolean
  loadingFiles?: string[]
  actionRequiredFiles?: string[]
  processedData?: any
}

export function SandpackInitialContent({
  activePreview,
  onPreviewSelect,
  unresolvedDependencies,
  getComponentFilePath,
  setComponentCode,
  isUnresolvedDependency,
  loadingFiles = [],
  actionRequiredFiles = [],
  processedData,
}: SandpackInitialContentProps) {
  const { sandpack } = useSandpack()
  const componentPath = getComponentFilePath()
  const { markFileAsRequiringAction, isActionRequired } = useActionRequired()
  const fileContentRef = useRef<Record<string, string>>({})

  // Initialize action required files from props
  useEffect(() => {
    // Add a tracker to prevent infinite loops
    const processedFileTracker = new Set<string>()

    // Add each file that requires action to our atom state
    actionRequiredFiles.forEach((file) => {
      // Skip if we've already processed this file
      if (processedFileTracker.has(file)) return
      processedFileTracker.add(file)

      if (file === "/tailwind.config.js" || file === "/globals.css") {
        if (processedData?.additionalStyles?.required) {
          const details: ActionRequiredDetails = {
            reason: "styles",
            tailwindExtensions:
              processedData.additionalStyles.tailwindExtensions,
            cssVariables: processedData.additionalStyles.cssVariables,
            keyframes: processedData.additionalStyles.keyframes,
            utilities: processedData.additionalStyles.utilities,
          }
          markFileAsRequiringAction(file, details)
        }
      } else {
        // For other files (likely missing imports)
        markFileAsRequiringAction(file, {
          reason: "unresolved_dependencies",
          message: "This component requires additional imports",
        })
      }
    })
  }, [actionRequiredFiles, processedData, markFileAsRequiringAction])

  // Store file content when it changes to prevent losing edits
  useEffect(() => {
    const currentContent = sandpack.files[sandpack.activeFile]?.code

    if (currentContent && sandpack.activeFile) {
      const path = sandpack.activeFile

      // Only update if content actually changed
      if (fileContentRef.current[path] !== currentContent) {
        fileContentRef.current[path] = currentContent
      }
    }
  }, [sandpack.files, sandpack.activeFile])

  // When a file disappears from sandpack but we have its content, restore it
  useEffect(() => {
    Object.entries(fileContentRef.current).forEach(([path, content]) => {
      if (path && content && !sandpack.files[path]) {
        try {
          sandpack.addFile(path, content)
        } catch (error) {
          // Error handling without logging
        }
      }
    })
  }, [sandpack.files, sandpack])

  // Set initial file only once when component mounts
  useEffect(() => {
    if (!activePreview) {
      sandpack.setActiveFile(componentPath)
      onPreviewSelect({
        type: "regular",
        filePath: componentPath,
      })
    }
  }, [componentPath, onPreviewSelect, sandpack, activePreview])

  const handleFileSelect = (path: string) => {
    // If the file is already selected, don't do anything
    if (activePreview?.filePath === path) {
      return
    }

    // Check if this is an unknown component
    if (isUnresolvedDependency(path)) {
      // For unknown components, get the component name
      const componentName = unresolvedDependencies?.find(
        (comp) => comp.path === path,
      )?.name

      if (componentName) {
        // Set as unknown component type preview
        onPreviewSelect({
          type: "unknown",
          filePath: path,
          componentName,
        })
      }
    } else {
      // Set as regular file type preview
      sandpack.setActiveFile(path)
      onPreviewSelect({
        type: "regular",
        filePath: path,
      })
    }
  }

  // Keep editor file in sync with selection for regular files
  useEffect(() => {
    if (
      activePreview?.type === "regular" &&
      activePreview.filePath &&
      sandpack.activeFile !== activePreview.filePath
    ) {
      sandpack.setActiveFile(activePreview.filePath)
    }
  }, [activePreview, sandpack])

  // Check if the current file needs style updates
  const showStylePanel =
    activePreview?.filePath &&
    isActionRequired(activePreview.filePath) &&
    activePreview.type !== "unknown" // Don't show panel for unknown components

  return (
    <SandpackLayout style={{ height: "100%" }}>
      <div className="flex w-full h-full">
        <div className="flex border-r border-border">
          <FileExplorer
            unresolvedDependencies={unresolvedDependencies}
            onFileSelect={handleFileSelect}
            selectedFile={activePreview?.filePath || ""}
            visibleFiles={sandpack.visibleFiles || []}
            loadingFiles={loadingFiles}
          />
        </div>
        <div className="flex-1 flex">
          <>
            <div className={cn("flex-1", showStylePanel && "w-2/3")}>
              <EditorCodePanel
                componentPath={activePreview?.filePath || componentPath}
                onCodeChange={(code: string) => {
                  setComponentCode(code)
                }}
              />
            </div>

            {/* Style requirements panel */}
            {showStylePanel && (
              <div className="w-1/3 p-2">
                <RequirementsPanel activeFile={activePreview.filePath} />
              </div>
            )}
          </>
        </div>
      </div>
    </SandpackLayout>
  )
}
