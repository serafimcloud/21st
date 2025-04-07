import React, { useEffect, useMemo } from "react"
import {
  SandpackProvider,
  SandpackLayout,
  SandpackFiles,
  SandpackPreview,
  OpenInCodeSandboxButton,
} from "@codesandbox/sandpack-react"
import {
  CodeManagerProvider,
  useCodeManager,
  useActionRequired,
  usePreviewReady,
} from "./context/editor-state"
import { ActionRequiredDetails } from "./context/editor-types"
import { EditorCodePanel } from "./editor-code-panel"
import { FileExplorer } from "./file-explorer"
import { RequirementsPanel } from "./requirements-panel"
import { cn } from "@/lib/utils"

interface EditorProps {
  initialFiles: SandpackFiles
  mainComponentPath: string
  unresolvedDependencies?: Array<{ name: string; path: string }>
  onCodeChange?: (path: string, content: string) => void
  isUnresolvedDependencyFn?: (path: string) => boolean
  activePath?: string
  sandpackTemplate?: "react" | "react-ts" | "vanilla" | "vanilla-ts"
  dependencies?: Record<string, string>
  visiblePaths?: string[]
  loadingFiles?: string[]
  actionRequiredFiles?: string[]
  processedData?: any
}

const MemoizedEditorContent = React.memo(EditorContent)

export function Editor({
  initialFiles,
  mainComponentPath,
  unresolvedDependencies = [],
  onCodeChange,
  isUnresolvedDependencyFn,
  activePath,
  sandpackTemplate = "react-ts",
  dependencies = {},
  visiblePaths,
  loadingFiles = [],
  actionRequiredFiles = [],
  processedData,
}: EditorProps) {
  // Cache sandpack configuration to prevent re-creation
  const sandpackConfig = useMemo(() => {
    return {
      files: initialFiles,
      template: sandpackTemplate,
      customSetup: {
        dependencies: {
          // Default dependencies
          react: "^18.0.0",
          "react-dom": "^18.0.0",
          "@radix-ui/react-icons": "^1.3.0",
          "class-variance-authority": "^0.7.0",
          clsx: "^2.0.0",
          "tailwind-merge": "^1.14.0",
          "tailwindcss-animate": "^1.0.7",
          ...dependencies,
        },
      },
    }
  }, [initialFiles, sandpackTemplate, dependencies])

  // Создаем стабильный ключ для CodeManagerProvider, который не меняется при каждом рендере
  const stableKey = useMemo(
    () => `editor-${mainComponentPath}-${Object.keys(initialFiles).length}`,
    [mainComponentPath, Object.keys(initialFiles).length],
  )

  return (
    <SandpackProvider {...sandpackConfig}>
      <CodeManagerProvider
        key={stableKey}
        initialComponentPath={activePath || mainComponentPath}
        unresolvedDependencies={unresolvedDependencies}
        onFileContentChange={onCodeChange}
        isUnknownComponentFn={isUnresolvedDependencyFn}
      >
        <div className="flex flex-col h-full">
          <MemoizedEditorContent
            visiblePaths={visiblePaths}
            loadingFiles={loadingFiles}
            actionRequiredFiles={actionRequiredFiles}
            processedData={processedData}
          />
        </div>
      </CodeManagerProvider>
    </SandpackProvider>
  )
}

interface EditorContentProps {
  visiblePaths?: string[]
  loadingFiles?: string[]
  actionRequiredFiles?: string[]
  processedData?: any
}

function EditorContent({
  visiblePaths,
  loadingFiles = [],
  actionRequiredFiles = [],
  processedData,
}: EditorContentProps) {
  const {
    activeFile,
    selectFile,
    isUnresolvedDependency,
    getComponentName,
    unresolvedDependencies,
    loadingComponents,
    addFile,
    allFiles,
    getFileContent,
  } = useCodeManager()

  const { markFileAsRequiringAction, markFileAsResolved, getActionDetails } =
    useActionRequired()

  // Get preview ready state
  const { previewReady } = usePreviewReady()

  // Initialize action required files from props only when they change
  useEffect(() => {
    // We need to prevent infinite loops by tracking processed files
    const processedFileTracker = new Set<string>()

    // Clear existing action required files
    actionRequiredFiles.forEach((file) => {
      // Skip if we've already processed this file in this effect run
      if (processedFileTracker.has(file)) return
      processedFileTracker.add(file)

      // For each file marked as requiring action in props
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

  // Auto-resolve action required for unknown components when edited
  useEffect(() => {
    if (!activeFile) return

    // Check if this is an unknown component with required action
    if (isUnresolvedDependency(activeFile)) {
      const actionDetails = getActionDetails(activeFile)

      if (actionDetails) {
        const content = getFileContent(activeFile)
        // If content has been changed from the default template
        if (content && !content.includes("TODO: Implement")) {
          console.log(
            "[Editor] Auto-resolving action for edited unknown component:",
            activeFile,
          )
          markFileAsResolved(activeFile)
        }
      }
    }
  }, [
    activeFile,
    isUnresolvedDependency,
    getActionDetails,
    getFileContent,
    markFileAsResolved,
  ])

  // Handle file selection
  const handleFileSelect = (path: string) => {
    console.log("[Editor] File selected:", {
      path,
      isUnknown: isUnresolvedDependency(path),
      existingFiles: allFiles,
    })

    // Normalize path - remove @/ prefix if present
    const normalizedPath = path.replace(/^@\//, "/")

    // Check if this is an unknown component and create an empty file if needed
    if (isUnresolvedDependency(path)) {
      // Get component name
      const componentName = getComponentName(path)

      // Only create the file if it doesn't already exist in the codebase
      const fileExists = allFiles.includes(normalizedPath)

      console.log("[Editor] Unknown component selected:", {
        path,
        normalizedPath,
        componentName,
        fileExists,
        isInSandpack: allFiles.includes(normalizedPath),
      })

      if (!fileExists) {
        console.log("[Editor] Creating file for unknown component:", {
          originalPath: path,
          normalizedPath,
          componentName,
        })

        // Create an empty file for the unknown component
        addFile(
          normalizedPath,
          `// TODO: Implement ${componentName || "this"} component`,
        )

        // Mark it as requiring action
        markFileAsRequiringAction(normalizedPath, {
          reason: "unresolved_dependencies",
          message: `This component needs to be implemented`,
        })
      } else {
        console.log(
          "[Editor] Unknown component file already exists:",
          normalizedPath,
        )
      }
    }

    // Always select the normalized path
    console.log("[Editor] Selecting file:", normalizedPath)
    selectFile(normalizedPath)
  }

  // Combine loading files from props and from context
  const allLoadingFiles = React.useMemo(() => {
    const combinedFiles = [...loadingFiles]
    if (loadingComponents && loadingComponents.length > 0) {
      loadingComponents.forEach((file) => {
        if (!combinedFiles.includes(file)) {
          combinedFiles.push(file)
        }
      })
    }
    return combinedFiles
  }, [loadingFiles, loadingComponents])

  // Check if the current file needs style updates
  const actionDetails = activeFile && getActionDetails(activeFile)
  const showStylePanel = !!actionDetails && actionDetails.reason === "styles"

  return (
    <SandpackLayout style={{ height: "100%", border: "none" }}>
      <div className="flex w-full h-full">
        <div className="flex border-r border-border" data-file-explorer>
          <FileExplorer
            unresolvedDependencies={unresolvedDependencies}
            onFileSelect={handleFileSelect}
            selectedFile={activeFile}
            visibleFiles={visiblePaths}
            loadingFiles={allLoadingFiles}
          />
        </div>

        {/* Code editor */}
        <div
          className={cn(
            "flex-1",
            previewReady && "max-w-[50%] border-r border-border",
          )}
        >
          <EditorCodePanel
            componentPath={activeFile || ""}
            onCodeChange={() => {
              // This will be handled by the CodeManager through the CodeEditor component
            }}
          />
        </div>

        {/* Show preview when ready */}
        {previewReady && (
          <div className="flex-1 flex flex-col">
            <div className="p-2 border-b border-border bg-muted/30 flex justify-between items-center">
              <h3 className="text-sm font-medium">Preview</h3>
              <OpenInCodeSandboxButton />
            </div>
            <div className="flex-1">
              <SandpackPreview
                showNavigator={true}
                showRefreshButton={true}
                showOpenInCodeSandbox={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* Style requirements panel - rendered absolutely */}
      {showStylePanel && <RequirementsPanel activeFile={activeFile} />}
    </SandpackLayout>
  )
}
