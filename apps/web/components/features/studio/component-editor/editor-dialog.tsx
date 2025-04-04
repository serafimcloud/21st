import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlusCircle } from "lucide-react"
import { Spinner } from "@/components/icons/spinner"
import {
  SandpackProvider,
  SandpackLayout,
  OpenInCodeSandboxButton,
  useSandpack,
} from "@codesandbox/sandpack-react"

import { CodeEditor } from "./code-editor"
import { FileExplorer } from "./file-explorer-sandpack"
import { CustomFileExplorer } from "./file-explorer"
import { CustomComponentView } from "./unknown-component-view"
import { usePublishDialog } from "./hooks/use-editor-dialog"
import React from "react"
import { CodeEditorComponent } from "./code-editor-component"

interface EditorDialogProps {
  userId: string
}

export function EditorDialog({ userId }: EditorDialogProps) {
  const {
    open,
    componentCode,
    processedData,
    isProcessing,
    activePreview,
    handleOpenChange,
    handleProcessComponent,
    handlePreviewSelect,
    setComponentCode,
    sandpackConfig,
    getComponentFilePath,
    isUnknownComponent,
  } = usePublishDialog({ userId })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Publish Component
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[1200px] sm:w-[90vw] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden"
        hideCloseButton
      >
        <DialogHeader className="flex flex-row p-4 gap-8 items-start justify-between border-b bg-muted">
          <div className="flex flex-col gap-2">
            <DialogTitle>Publish New Component</DialogTitle>
            <DialogDescription>
              Enter your component code below. Make sure it follows our
              guidelines and includes all necessary imports.
            </DialogDescription>
          </div>

          <Button
            onClick={handleProcessComponent}
            disabled={isProcessing || !componentCode.trim()}
            className="ml-auto !mt-0"
          >
            {isProcessing ? (
              <>
                <span className="mr-2">
                  <Spinner size={16} />
                </span>
                Processing...
              </>
            ) : (
              "Process Component"
            )}
          </Button>
        </DialogHeader>

        <div className="flex-grow overflow-hidden flex flex-col h-full">
          <div className="h-full min-h-[400px] overflow-hidden flex-grow">
            {/* If we have active preview and processed data, use the new CodeEditorComponent */}
            {processedData ? (
              <CodeEditorComponent
                initialFiles={sandpackConfig.files}
                mainComponentPath={getComponentFilePath()}
                nonShadcnComponents={processedData?.nonShadcnComponentsImports}
                onCodeChange={(path, content) => {
                  if (path === getComponentFilePath()) {
                    setComponentCode(content)
                  }
                }}
                isUnknownComponentFn={isUnknownComponent}
                activePath={activePreview?.filePath}
                sandpackTemplate={sandpackConfig.template}
                dependencies={sandpackConfig.customSetup?.dependencies}
              />
            ) : (
              /* Otherwise use the original SandpackContent */
              <SandpackProvider {...sandpackConfig}>
                <SandpackContent
                  activePreview={activePreview}
                  onPreviewSelect={handlePreviewSelect}
                  nonShadcnComponents={
                    processedData?.nonShadcnComponentsImports
                  }
                  getComponentFilePath={getComponentFilePath}
                  setComponentCode={setComponentCode}
                  isUnknownComponent={isUnknownComponent}
                />
              </SandpackProvider>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface SandpackContentProps {
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
  nonShadcnComponents?: Array<{ name: string; path: string }>
  getComponentFilePath: () => string
  setComponentCode: (code: string) => void
  isUnknownComponent: (path: string) => boolean
}

function SandpackContent({
  activePreview,
  onPreviewSelect,
  nonShadcnComponents,
  getComponentFilePath,
  setComponentCode,
  isUnknownComponent,
}: SandpackContentProps) {
  const { sandpack } = useSandpack()
  const componentPath = getComponentFilePath()

  // Log Sandpack state changes
  React.useEffect(() => {
    console.log("[EditorDialog] Current Sandpack state:", {
      activeFile: sandpack.activeFile,
      files: Object.keys(sandpack.files),
      visibleFiles: sandpack.visibleFiles,
      currentFileContent:
        sandpack.files[sandpack.activeFile]?.code?.slice(0, 50) + "...",
      stackTrace: new Error().stack,
    })
  }, [sandpack.activeFile, sandpack.files, sandpack.visibleFiles])

  // Set initial file only once when component mounts
  React.useEffect(() => {
    if (!activePreview) {
      console.log("[EditorDialog] Setting initial file:", {
        componentPath,
        currentSandpackFile: sandpack.activeFile,
        stackTrace: new Error().stack,
      })
      sandpack.setActiveFile(componentPath)
      onPreviewSelect({
        type: "regular",
        filePath: componentPath,
      })
    }
  }, [componentPath, onPreviewSelect, sandpack, activePreview])

  const handleFileSelect = (path: string) => {
    console.log("[EditorDialog] File selected:", path)
    console.log("[EditorDialog] Current editor state:", {
      activeFile: sandpack.activeFile,
      selectedPath: path,
      activePreview: activePreview,
      fileContent: sandpack.files[path]?.code?.slice(0, 50) + "...",
      currentFileContent:
        sandpack.files[sandpack.activeFile]?.code?.slice(0, 50) + "...",
      stackTrace: new Error().stack,
    })

    // If the file is already selected, don't do anything
    if (activePreview?.filePath === path) {
      console.log("[EditorDialog] File already selected, skipping", {
        path,
        activePreview,
        sandpackFile: sandpack.activeFile,
      })
      return
    }

    // Check if this is an unknown component
    if (isUnknownComponent(path)) {
      console.log("[EditorDialog] Handling unknown component selection:", {
        path,
        currentSandpackFile: sandpack.activeFile,
        stackTrace: new Error().stack,
      })
      // For unknown components, get the component name
      const componentName = nonShadcnComponents?.find(
        (comp) => comp.path === path,
      )?.name

      if (componentName) {
        console.log("[EditorDialog] Setting unknown component preview:", {
          componentName,
          path,
          currentSandpackFile: sandpack.activeFile,
        })
        // Set as unknown component type preview
        onPreviewSelect({
          type: "unknown",
          filePath: path,
          componentName,
        })
      }
    } else {
      console.log("[EditorDialog] Setting regular file preview:", {
        path,
        currentSandpackFile: sandpack.activeFile,
        fileContent: sandpack.files[path]?.code?.slice(0, 50) + "...",
      })
      // Set as regular file type preview
      onPreviewSelect({
        type: "regular",
        filePath: path,
      })

      // Update the Sandpack editor file
      console.log("[EditorDialog] Updating Sandpack editor file to:", {
        from: sandpack.activeFile,
        to: path,
        hasFileContent: Boolean(sandpack.files[path]?.code),
        stackTrace: new Error().stack,
      })
      sandpack.setActiveFile(path)
    }
  }

  // Keep editor file in sync with selection for regular files
  React.useEffect(() => {
    if (
      activePreview?.type === "regular" &&
      activePreview.filePath &&
      sandpack.activeFile !== activePreview.filePath
    ) {
      console.log("[EditorDialog] Syncing editor file:", {
        from: sandpack.activeFile,
        to: activePreview.filePath,
        activePreviewType: activePreview.type,
        fileContent:
          sandpack.files[activePreview.filePath]?.code?.slice(0, 50) + "...",
        currentFileContent:
          sandpack.files[sandpack.activeFile]?.code?.slice(0, 50) + "...",
        stackTrace: new Error().stack,
      })
      sandpack.setActiveFile(activePreview.filePath)
    }
  }, [activePreview, sandpack.activeFile, sandpack.files])

  return (
    <>
      <div className="absolute bottom-2 right-2">
        <OpenInCodeSandboxButton />
      </div>
      <SandpackLayout style={{ height: "100%" }}>
        <div className="flex w-full h-full">
          <div className="flex border-r border-border">
            {/* <FileExplorer /> */}
            <CustomFileExplorer
              nonShadcnComponents={nonShadcnComponents}
              onFileSelect={handleFileSelect}
              selectedFile={activePreview?.filePath || null}
            />
          </div>
          <div className="flex-1">
            {activePreview?.type === "unknown" ? (
              <CustomComponentView
                componentName={activePreview.componentName || ""}
              />
            ) : (
              <CodeEditor
                componentPath={activePreview?.filePath || componentPath}
                onCodeChange={setComponentCode}
              />
            )}
          </div>
        </div>
      </SandpackLayout>
    </>
  )
}
