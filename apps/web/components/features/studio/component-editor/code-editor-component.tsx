import React from "react"
import {
  SandpackProvider,
  SandpackLayout,
  SandpackFiles,
} from "@codesandbox/sandpack-react"
import { CodeManagerProvider, useCodeManager } from "./code-manager"
import { CodeEditor } from "./code-editor"
import { CustomFileExplorer } from "./file-explorer"
import { CustomComponentView } from "./unknown-component-view"

interface CodeEditorComponentProps {
  initialFiles: SandpackFiles
  mainComponentPath: string
  nonShadcnComponents?: Array<{ name: string; path: string }>
  onCodeChange?: (path: string, content: string) => void
  isUnknownComponentFn?: (path: string) => boolean
  activePath?: string
  sandpackTemplate?: "react" | "react-ts" | "vanilla" | "vanilla-ts"
  dependencies?: Record<string, string>
}

export function CodeEditorComponent({
  initialFiles,
  mainComponentPath,
  nonShadcnComponents = [],
  onCodeChange,
  isUnknownComponentFn = () => false,
  activePath,
  sandpackTemplate = "react-ts",
  dependencies = {},
}: CodeEditorComponentProps) {
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
          <EditorContent />
        </div>
      </CodeManagerProvider>
    </SandpackProvider>
  )
}

function EditorContent() {
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
          <CustomFileExplorer
            nonShadcnComponents={nonShadcnComponents}
            onFileSelect={handleFileSelect}
            selectedFile={activeFile}
          />
        </div>
        <div className="flex-1">
          {activeFile && isUnknownComponent(activeFile) ? (
            <CustomComponentView
              componentName={getComponentName(activeFile) || "Component"}
            />
          ) : (
            <CodeEditor
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
