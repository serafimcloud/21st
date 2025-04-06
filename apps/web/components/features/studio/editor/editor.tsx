import React, { useEffect } from "react"
import {
  SandpackProvider,
  SandpackLayout,
  SandpackFiles,
} from "@codesandbox/sandpack-react"
import {
  CodeManagerProvider,
  useCodeManager,
  useActionRequired,
  ActionRequiredDetails,
} from "./context/editor-state"
import { EditorCodePanel } from "./editor-code-panel"
import { FileExplorer } from "./file-explorer"
import { FallbackComponentView } from "./fallback-component-view"
import { StyleRequirementsPanel } from "./requirements-panel"
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
  processedData?: any
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

  const { markFileAsRequiringAction, isActionRequired } = useActionRequired()

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
          reason: "missing_import",
          message: "This component requires additional imports",
        })
      }
    })
  }, [actionRequiredFiles, processedData, markFileAsRequiringAction])

  // Handle file selection
  const handleFileSelect = (path: string) => {
    selectFile(path)
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
  const showStylePanel = activeFile && isActionRequired(activeFile)

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
                  <StyleRequirementsPanel activeFile={activeFile} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </SandpackLayout>
  )
}
