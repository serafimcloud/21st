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
} from "@codesandbox/sandpack-react"

import { CodeEditor } from "./code-editor"
import { FileExplorer } from "./file-explorer"
import { CustomFileExplorer } from "./custom-file-explorer"
import { usePublishDialog } from "./use-publish-dialog"

interface PublishDialogProps {
  userId: string
}

export function PublishDialog({ userId }: PublishDialogProps) {
  const {
    open,
    componentCode,
    isProcessing,
    handleOpenChange,
    handleProcessComponent,
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
              <div className="absolute bottom-2 right-2">
                <OpenInCodeSandboxButton />
              </div>
              <SandpackLayout style={{ height: "100%" }}>
                <div className="flex w-full h-full">
                  <div className="flex border-r border-border">
                    <FileExplorer />
                    <CustomFileExplorer />
                  </div>
                  <div className="flex-1">
                    <CodeEditor
                      componentPath={getComponentFilePath()}
                      onCodeChange={setComponentCode}
                    />
                  </div>
                </div>
              </SandpackLayout>
            </SandpackProvider>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
