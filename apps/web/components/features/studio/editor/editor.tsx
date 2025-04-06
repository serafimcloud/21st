import React from "react"
import {
  SandpackProvider,
  SandpackLayout,
  SandpackFiles,
} from "@codesandbox/sandpack-react"
import { CodeManagerProvider, useCodeManager } from "./context/editor-state"
import { EditorCodePanel } from "./editor-code-panel"
import { FileExplorer } from "./file-explorer"
import { FallbackComponentView } from "./fallback-component-view"
import { StyleRequirementsPanel } from "./style-requirements-panel"
import { cn } from "@/lib/utils"

interface EditorProps {
  initialFiles: SandpackFiles
  mainComponentPath: string
  nonShadcnComponents?: Array<{ name: string; path: string }>
  onCodeChange?: (path: string, content: string) => void
  isUnknownComponentFn?: (path: string) => boolean
  activePath?: string
  sandpackTemplate?: "react" | "react-ts" | "vanilla" | "vanilla-ts"
  dependencies?: Record<string, string>
  visiblePaths?: string[]
  loadingFiles?: string[]
  loadingStyleFiles?: string[]
  actionRequiredFiles?: string[]
  processedData?: any
}

export function Editor({
  initialFiles,
  mainComponentPath,
  nonShadcnComponents = [],
  onCodeChange,
  isUnknownComponentFn = () => false,
  activePath,
  sandpackTemplate = "react-ts",
  dependencies = {},
  visiblePaths,
  loadingFiles = [],
  loadingStyleFiles = [],
  actionRequiredFiles = [],
  processedData,
}: EditorProps) {
  // Setup sandpack configuration
  const sandpackConfig = {
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

  return (
    <SandpackProvider {...sandpackConfig}>
      <CodeManagerProvider
        initialComponentPath={activePath || mainComponentPath}
        nonShadcnComponents={nonShadcnComponents}
        onFileContentChange={onCodeChange}
        isUnknownComponentFn={isUnknownComponentFn}
      >
        <div className="flex flex-col h-full">
          <EditorContent
            visiblePaths={visiblePaths}
            loadingFiles={loadingFiles}
            loadingStyleFiles={loadingStyleFiles}
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
  loadingStyleFiles?: string[]
  actionRequiredFiles?: string[]
  processedData?: any // Add this to pass the processed data with styles information
}

function EditorContent({
  visiblePaths,
  loadingFiles = [],
  loadingStyleFiles = [],
  actionRequiredFiles = [],
  processedData,
}: EditorContentProps) {
  const {
    activeFile,
    selectFile,
    isUnknownComponent,
    getComponentName,
    nonShadcnComponents,
    loadingComponents,
  } = useCodeManager()

  // Log loading files for debugging with React.useEffect instead of just useEffect
  React.useEffect(() => {
    if (loadingFiles.length > 0) {
      console.log("[EditorContent] Received loading files:", loadingFiles)

      // Force a re-render to ensure loading files are displayed immediately
      const filesExplorerElement = document.querySelector(
        "[data-file-explorer]",
      )
      if (filesExplorerElement) {
        filesExplorerElement.classList.add("loading-files-active")
        setTimeout(() => {
          filesExplorerElement.classList.remove("loading-files-active")
        }, 100)
      }
    }
  }, [loadingFiles])

  // Log loading style files
  React.useEffect(() => {
    if (loadingStyleFiles.length > 0) {
      console.log(
        "[EditorContent] Received loading style files:",
        loadingStyleFiles,
      )
    }
  }, [loadingStyleFiles])

  // Also add a React.useEffect to log action required files
  React.useEffect(() => {
    if (actionRequiredFiles.length > 0) {
      console.log(
        "[EditorContent] Files requiring action:",
        actionRequiredFiles,
      )
    }
  }, [actionRequiredFiles])

  // Handle file selection
  const handleFileSelect = (path: string) => {
    selectFile(path)
  }

  // Combine loading files from props and from context
  const allLoadingFiles = React.useMemo(() => {
    const combinedFiles = [...loadingFiles]
    if (loadingComponents && loadingComponents.length > 0) {
      console.log(
        "[EditorContent] Combined with context loading files:",
        loadingComponents,
      )
      loadingComponents.forEach((file) => {
        if (!combinedFiles.includes(file)) {
          combinedFiles.push(file)
        }
      })
    }
    return combinedFiles
  }, [loadingFiles, loadingComponents])

  // Check if the current file needs style updates
  const showStylePanel =
    activeFile &&
    actionRequiredFiles.includes(activeFile) &&
    processedData?.additionalStyles?.required

  return (
    <SandpackLayout style={{ height: "100%", border: "none" }}>
      <div className="flex w-full h-full">
        <div className="flex border-r border-border" data-file-explorer>
          <FileExplorer
            nonShadcnComponents={nonShadcnComponents}
            onFileSelect={handleFileSelect}
            selectedFile={activeFile}
            visibleFiles={visiblePaths}
            loadingFiles={allLoadingFiles}
            loadingStyleFiles={loadingStyleFiles}
            actionRequiredFiles={actionRequiredFiles}
          />
        </div>
        <div className="flex-1 flex">
          {activeFile && isUnknownComponent(activeFile) ? (
            <FallbackComponentView
              componentName={getComponentName(activeFile) || "Component"}
            />
          ) : (
            <>
              <div className={cn("flex-1", showStylePanel && "w-2/3")}>
                <EditorCodePanel
                  componentPath={activeFile || ""}
                  onCodeChange={() => {
                    // This will be handled by the CodeManager through the CodeEditor component
                  }}
                />
              </div>

              {/* Style requirements panel */}
              {showStylePanel && (
                <div className="w-1/3 p-2">
                  <StyleRequirementsPanel
                    actionRequiredFiles={actionRequiredFiles}
                    additionalStyles={processedData?.additionalStyles}
                    activeFile={activeFile}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </SandpackLayout>
  )
}
