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
}

function EditorContent({
  visiblePaths,
  loadingFiles = [],
  loadingStyleFiles = [],
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
        <div className="flex-1">
          {activeFile && isUnknownComponent(activeFile) ? (
            <FallbackComponentView
              componentName={getComponentName(activeFile) || "Component"}
            />
          ) : (
            <EditorCodePanel
              componentPath={activeFile || ""}
              onCodeChange={() => {
                // This will be handled by the CodeManager through the CodeEditor component
              }}
            />
          )}
        </div>
      </div>
    </SandpackLayout>
  )
}
