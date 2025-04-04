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
import { FileExplorer } from "./file-explorer"
import { CustomFileExplorer } from "./custom-file-explorer"
import { CustomComponentView } from "./custom-component-view"
import { usePublishDialog } from "./use-publish-dialog"
import React from "react"

interface PublishDialogProps {
  userId: string
}

export function PublishDialog({ userId }: PublishDialogProps) {
  const {
    open,
    componentCode,
    processedData,
    isProcessing,
    selectedCustomComponent,
    selectedFile,
    handleOpenChange,
    handleProcessComponent,
    handleCustomComponentClick,
    handleFileClick,
    setComponentCode,
    sandpackConfig,
    getComponentFilePath,
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
        className="sm:max-w-[90vw] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden"
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
            <SandpackProvider {...sandpackConfig}>
              <SandpackContent
                selectedCustomComponent={selectedCustomComponent}
                selectedFile={selectedFile}
                onFileSelect={handleFileClick}
                onCustomComponentClick={handleCustomComponentClick}
                nonShadcnComponents={processedData?.nonShadcnComponentsImports}
                getComponentFilePath={getComponentFilePath}
                setComponentCode={setComponentCode}
              />
            </SandpackProvider>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface SandpackContentProps {
  selectedCustomComponent: string | null
  selectedFile: string | null
  onFileSelect: (path: string) => void
  onCustomComponentClick: (name: string) => void
  nonShadcnComponents?: Array<{ name: string; path: string }>
  getComponentFilePath: () => string
  setComponentCode: (code: string) => void
}

function SandpackContent({
  selectedCustomComponent,
  selectedFile,
  onFileSelect,
  onCustomComponentClick,
  nonShadcnComponents,
  getComponentFilePath,
  setComponentCode,
}: SandpackContentProps) {
  const { sandpack } = useSandpack()
  const componentPath = getComponentFilePath()

  // Set initial file only once when component mounts
  React.useEffect(() => {
    if (!selectedFile && !selectedCustomComponent) {
      sandpack.setActiveFile(componentPath)
      onFileSelect(componentPath)
    }
  }, [
    componentPath,
    onFileSelect,
    sandpack,
    selectedFile,
    selectedCustomComponent,
  ])

  const handleFileSelect = (path: string) => {
    // Check if this is an unknown component
    const isUnknownComponent = nonShadcnComponents?.some(
      (comp) => comp.path === path,
    )

    if (isUnknownComponent) {
      // For unknown components, don't change the editor file
      const componentName = nonShadcnComponents?.find(
        (comp) => comp.path === path,
      )?.name
      if (componentName) {
        onCustomComponentClick(componentName)
        onFileSelect(path) // Update selectedFile to highlight in tree
      }
    } else {
      // For regular files, update both the editor and selection
      onFileSelect(path)
      sandpack.setActiveFile(path)
    }
  }

  // Keep editor file in sync with selection for non-custom components
  React.useEffect(() => {
    if (
      !selectedCustomComponent &&
      selectedFile &&
      sandpack.activeFile !== selectedFile
    ) {
      sandpack.setActiveFile(selectedFile)
    }
  }, [selectedFile, selectedCustomComponent, sandpack.activeFile])

  return (
    <>
      <div className="absolute bottom-2 right-2">
        <OpenInCodeSandboxButton />
      </div>
      <SandpackLayout style={{ height: "100%" }}>
        <div className="flex w-full h-full">
          <div className="flex border-r border-border">
            <FileExplorer />
            <CustomFileExplorer
              nonShadcnComponents={nonShadcnComponents}
              onCustomComponentClick={onCustomComponentClick}
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
            />
          </div>
          <div className="flex-1">
            {selectedCustomComponent ? (
              <CustomComponentView componentName={selectedCustomComponent} />
            ) : (
              <CodeEditor
                componentPath={selectedFile || componentPath}
                onCodeChange={setComponentCode}
              />
            )}
          </div>
        </div>
      </SandpackLayout>
    </>
  )
}
