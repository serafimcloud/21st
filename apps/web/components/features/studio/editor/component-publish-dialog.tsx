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
import { EditorCodePanel } from "./editor-code-panel"
import { usePublishDialog } from "./hooks/use-editor-dialog"
import React, { useEffect, useRef, useState } from "react"
import { Editor } from "./editor"
import { RequirementsPanel } from "./requirements-panel"
import { cn } from "@/lib/utils"
import {
  useActionRequired,
  ActionRequiredDetails,
} from "./context/editor-state"

interface ComponentPublishDialogProps {
  userId: string
}

// Create a stable container for SandpackProvider to prevent re-rendering
const StableSandpackContainer = React.memo(
  ({ children, config }: { children: React.ReactNode; config: any }) => {
    // Use a ref to maintain the same config object reference
    const configRef = useRef(config)

    // Only update the ref if critical values change
    useEffect(() => {
      if (config.files !== configRef.current.files) {
        configRef.current = config
      }
    }, [config])

    return (
      <SandpackProvider {...configRef.current}>{children}</SandpackProvider>
    )
  },
)

// Memoize the Editor component to prevent unnecessary re-renders
const MemoizedEditor = React.memo(Editor)

// Memoize SandpackContent component
const MemoizedSandpackContent = React.memo(SandpackContent)

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

  // Create a stable reference to dialogContent
  const [dialogContent, setDialogContent] = useState<React.ReactNode | null>(
    null,
  )

  // Only update dialog content when necessary data changes
  useEffect(() => {
    if (!open) return

    const content = processedData ? (
      <StableSandpackContainer config={sandpackConfig}>
        <MemoizedEditor
          initialFiles={sandpackConfig.files}
          mainComponentPath={getComponentFilePath()}
          nonShadcnComponents={processedData?.nonShadcnComponentsImports}
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
      </StableSandpackContainer>
    ) : (
      <StableSandpackContainer config={sandpackConfig}>
        <MemoizedSandpackContent
          activePreview={activePreview}
          onPreviewSelect={handlePreviewSelect}
          nonShadcnComponents={processedData?.nonShadcnComponentsImports}
          getComponentFilePath={getComponentFilePath}
          setComponentCode={setComponentCode}
          isUnknownComponent={isUnknownComponent}
          loadingFiles={loadingShadcnComponents}
          loadingStyleFiles={loadingStyleFiles}
          actionRequiredFiles={actionRequiredFiles}
          processedData={processedData}
        />
      </StableSandpackContainer>
    )

    setDialogContent(content)
  }, [
    open,
    processedData,
    sandpackConfig,
    activePreview,
    actionRequiredFiles,
    // Do NOT include frequently changing props that don't affect structure
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
            {/* Render the stable dialog content */}
            {dialogContent}
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
          reason: "missing_import",
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
        console.log("[SandpackContent] Stored file content:", {
          path,
          contentLength: currentContent.length,
        })
      }
    }
  }, [sandpack.files, sandpack.activeFile])

  // When a file disappears from sandpack but we have its content, restore it
  useEffect(() => {
    Object.entries(fileContentRef.current).forEach(([path, content]) => {
      if (path && content && !sandpack.files[path]) {
        console.log("[SandpackContent] Restoring lost file:", path)
        try {
          sandpack.addFile(path, content)
        } catch (error) {
          console.error("[SandpackContent] Error restoring file:", error)
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
    if (isUnknownComponent(path)) {
      // For unknown components, get the component name
      const componentName = nonShadcnComponents?.find(
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
            nonShadcnComponents={nonShadcnComponents}
            onFileSelect={handleFileSelect}
            selectedFile={activePreview?.filePath || ""}
            visibleFiles={sandpack.visibleFiles || []}
            loadingFiles={loadingFiles}
            loadingStyleFiles={loadingStyleFiles}
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
