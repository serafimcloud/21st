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
          <EditorContent visiblePaths={visiblePaths} />
        </div>
      </CodeManagerProvider>
    </SandpackProvider>
  )
}

interface EditorContentProps {
  visiblePaths?: string[]
}

function EditorContent({ visiblePaths }: EditorContentProps) {
  const {
    activeFile,
    selectFile,
    isUnknownComponent,
    getComponentName,
    nonShadcnComponents,
  } = useCodeManager()

  // Handle file selection
  const handleFileSelect = (path: string) => {
    selectFile(path)
  }

  return (
    <SandpackLayout style={{ height: "100%", border: "none" }}>
      <div className="flex w-full h-full">
        <div className="flex border-r border-border">
          <FileExplorer
            nonShadcnComponents={nonShadcnComponents}
            onFileSelect={handleFileSelect}
            selectedFile={activeFile}
            visibleFiles={visiblePaths}
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
