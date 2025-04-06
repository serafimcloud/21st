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
  useSandpack,
} from "@codesandbox/sandpack-react"

import { FileExplorer } from "./file-explorer"
import { FallbackComponentView } from "./fallback-component-view"
import { EditorCodePanel } from "./editor-code-panel"
import { usePublishDialog } from "./hooks/use-editor-dialog"
import React from "react"
import { Editor } from "./editor"
import { StyleRequirementsPanel } from "./style-requirements-panel"
import { cn } from "@/lib/utils"

interface ComponentPublishDialogProps {
  userId: string
}

export function ComponentPublishDialog({
  userId,
}: ComponentPublishDialogProps) {
  const {
    open,
    componentCode,
    processedData,
    isProcessing,
    activePreview,
    loadingShadcnComponents,
    loadingStyleFiles,
    actionRequiredFiles,
    handleOpenChange,
    handleProcessComponent,
    handlePreviewSelect,
    setComponentCode,
    sandpackConfig,
    getComponentFilePath,
    isUnknownComponent,
  } = usePublishDialog({ userId })

  // Simplified useEffect just for logging
  React.useEffect(() => {
    if (loadingShadcnComponents.length > 0) {
      console.log(
        "[ComponentPublishDialog] Active loading components detected:",
        loadingShadcnComponents,
      )

      // Check if our loadingShadcnComponents has paths that match any existing files
      if (processedData?.shadcnComponentsImports) {
        const matchingFiles = processedData.shadcnComponentsImports
          .filter((comp: any) => {
            const path = `/components/ui/${comp.name.toLowerCase()}.tsx`
            const isLoading = loadingShadcnComponents.includes(path)
            console.log(
              `[ComponentPublishDialog] Component ${comp.name} loading status:`,
              isLoading,
            )
            return isLoading
          })
          .map((comp: any) => comp.name)

        if (matchingFiles.length > 0) {
          console.log(
            "[ComponentPublishDialog] Currently loading components:",
            matchingFiles,
          )
        }
      }
    }

    if (loadingStyleFiles.length > 0) {
      console.log(
        "[ComponentPublishDialog] Style files in loading state:",
        loadingStyleFiles,
      )
    }

    if (actionRequiredFiles.length > 0) {
      console.log(
        "[ComponentPublishDialog] Files requiring action:",
        actionRequiredFiles,
      )
    }
  }, [
    loadingShadcnComponents,
    loadingStyleFiles,
    actionRequiredFiles,
    processedData,
  ])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Publish Component
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[1600px] sm:w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
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
              <SandpackProvider {...sandpackConfig}>
                <Editor
                  initialFiles={sandpackConfig.files}
                  mainComponentPath={getComponentFilePath()}
                  nonShadcnComponents={
                    processedData?.nonShadcnComponentsImports
                  }
                  onCodeChange={(path: string, content: string) => {
                    if (path === getComponentFilePath()) {
                      setComponentCode(content)
                    }
                  }}
                  isUnknownComponentFn={isUnknownComponent}
                  activePath={activePreview?.filePath}
                  sandpackTemplate={sandpackConfig.template}
                  dependencies={sandpackConfig.customSetup?.dependencies}
                  visiblePaths={
                    Array.isArray(sandpackConfig.options?.visibleFiles)
                      ? sandpackConfig.options.visibleFiles
                      : [
                          getComponentFilePath(),
                          "/components/",
                          "/tailwind.config.js",
                          "/globals.css",
                          "/package.json",
                        ]
                  }
                  loadingFiles={loadingShadcnComponents}
                  loadingStyleFiles={loadingStyleFiles}
                  actionRequiredFiles={actionRequiredFiles}
                  processedData={processedData}
                />
              </SandpackProvider>
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
                  loadingFiles={loadingShadcnComponents}
                  loadingStyleFiles={loadingStyleFiles}
                  actionRequiredFiles={actionRequiredFiles}
                  processedData={processedData}
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
  loadingFiles?: string[]
  loadingStyleFiles?: string[]
  actionRequiredFiles?: string[]
  processedData?: any
}

function SandpackContent({
  activePreview,
  onPreviewSelect,
  nonShadcnComponents,
  getComponentFilePath,
  setComponentCode,
  isUnknownComponent,
  loadingFiles = [],
  loadingStyleFiles = [],
  actionRequiredFiles = [],
  processedData,
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

  // Log loading file states
  React.useEffect(() => {
    if (loadingFiles.length > 0) {
      console.log("[SandpackContent] Component loading files:", loadingFiles)
    }
    if (loadingStyleFiles.length > 0) {
      console.log("[SandpackContent] Style loading files:", loadingStyleFiles)
    }
    if (actionRequiredFiles.length > 0) {
      console.log(
        "[SandpackContent] Files requiring action:",
        actionRequiredFiles,
      )
    }
  }, [loadingFiles, loadingStyleFiles, actionRequiredFiles])

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
      sandpack.setActiveFile(path)
      onPreviewSelect({
        type: "regular",
        filePath: path,
      })
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

  // Check if the current file needs style updates
  const showStylePanel =
    activePreview?.filePath &&
    actionRequiredFiles.includes(activePreview.filePath) &&
    processedData?.additionalStyles?.required

  return (
    <SandpackLayout style={{ height: "100%" }}>
      <div className="flex w-full h-full">
        <div className="flex border-r border-border">
          <FileExplorer
            nonShadcnComponents={nonShadcnComponents}
            onFileSelect={handleFileSelect}
            selectedFile={activePreview?.filePath || ""}
            visibleFiles={sandpack.visibleFiles || []}
            loadingFiles={loadingFiles}
            loadingStyleFiles={loadingStyleFiles}
            actionRequiredFiles={actionRequiredFiles}
          />
        </div>
        <div className="flex-1 flex">
          {activePreview && isUnknownComponent(activePreview.filePath) ? (
            <FallbackComponentView
              componentName={activePreview.componentName || "Unknown Component"}
            />
          ) : (
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
                  <StyleRequirementsPanel
                    actionRequiredFiles={actionRequiredFiles}
                    additionalStyles={processedData?.additionalStyles}
                    activeFile={activePreview.filePath}
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
