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
import { SandpackProvider } from "@codesandbox/sandpack-react"

import { usePublishDialog } from "./hooks/use-editor-dialog"
import React, { useEffect, useRef, useState } from "react"
import { Editor } from "./editor"
import { SandpackInitialContent } from "./sandpack-initial-content"

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
const MemoizedSandpackInitialContent = React.memo(SandpackInitialContent)

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
    actionRequiredFiles,
    handleOpenChange,
    handleProcessComponent,
    handlePreviewSelect,
    setComponentCode,
    sandpackConfig,
    getComponentFilePath,
    isUnresolvedDependency,
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
          unresolvedDependencies={processedData?.unresolvedDependencyImports}
          onCodeChange={(path: string, content: string) => {
            if (path === getComponentFilePath()) {
              setComponentCode(content)
            }
          }}
          isUnresolvedDependencyFn={isUnresolvedDependency}
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
          actionRequiredFiles={actionRequiredFiles}
          processedData={processedData}
        />
      </StableSandpackContainer>
    ) : (
      <StableSandpackContainer config={sandpackConfig}>
        <MemoizedSandpackInitialContent
          activePreview={activePreview}
          onPreviewSelect={handlePreviewSelect}
          unresolvedDependencies={processedData?.unresolvedDependencyImports}
          getComponentFilePath={getComponentFilePath}
          setComponentCode={setComponentCode}
          isUnresolvedDependency={isUnresolvedDependency}
          loadingFiles={loadingShadcnComponents}
          actionRequiredFiles={actionRequiredFiles}
          processedData={processedData}
        />
      </StableSandpackContainer>
    )

    setDialogContent(content)
  }, [
    open,
    processedData,
    getComponentFilePath,
    activePreview?.filePath,
    loadingShadcnComponents,
    actionRequiredFiles,
    // Include only the stable, primitive values from sandpackConfig that should trigger re-renders
    sandpackConfig.template,
    // Do NOT include frequently changing props that don't affect structure
  ])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Publish Component | OLD
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
