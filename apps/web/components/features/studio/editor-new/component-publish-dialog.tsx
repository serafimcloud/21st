import React, { useState } from "react"
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
import { Editor } from "./editor"

type ComponentPublishDialogProps = {}

export function ComponentPublishDialog({}: ComponentPublishDialogProps) {
  const [open, setOpen] = useState(false)
  const [componentCode, setComponentCode] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [dialogContent, setDialogContent] = useState<React.ReactNode>(null)

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setComponentCode("")
      setDialogContent(null)
      setIsProcessing(false)
    }
  }

  const handleProcessComponent = async () => {
    setIsProcessing(true)
    try {
      // Process component logic here
      // if (onPublish) {
      //   onPublish(componentCode)
      // }
      // Set dialog content with the result
      setDialogContent(<div>Component processed successfully</div>)
    } catch (error) {
      setDialogContent(<div>Error processing component</div>)
    } finally {
      setIsProcessing(false)
    }
  }

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
            <Editor />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
