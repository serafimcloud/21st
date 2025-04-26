import { useEffect, useRef, useState } from "react"
import { RefreshCw, PanelRightOpen, PanelRightClose } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { EditorPane } from "./EditorPane"
import { cn } from "@/lib/utils"

interface PreviewPaneProps {
  previewURL: string | null
  isPreviewVisible?: boolean
  selectedFile?: any
  code?: string
  onCodeChange?: (value: string) => void
  isFileLoading?: boolean
  connectedShellId?: string
}

export function PreviewPane({
  previewURL,
  isPreviewVisible = true,
  selectedFile = null,
  code = "",
  onCodeChange = () => {},
  isFileLoading = false,
  connectedShellId = "",
}: PreviewPaneProps) {
  const [iframeKey, setIframeKey] = useState<number>(0)
  const [showPreview, setShowPreview] = useState<boolean>(isPreviewVisible)

  const [previousConnectedShellId, setPreviousConnectedShellId] = useState<
    string | null
  >(connectedShellId)

  //  takes time to complile need to reload iframe, will be fixed at codesandbox SDK team side
  useEffect(() => {
    if (
      previousConnectedShellId !== connectedShellId &&
      previousConnectedShellId !== ""
    ) {
      setTimeout(() => {
        setIframeKey((prev) => prev + 1)
      }, 1000 * 8)
    }
  }, [connectedShellId])

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1)
  }

  const togglePreview = () => {
    setShowPreview((prev) => !prev)
  }

  return (
    <div className="relative h-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={showPreview ? 50 : 100} minSize={30}>
          <EditorPane
            selectedFile={selectedFile}
            code={code}
            onCodeChange={onCodeChange}
            isLoading={isFileLoading}
          />
        </ResizablePanel>
        {showPreview && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
                  <div className="text-sm h-7 font-medium mt-2 ">Preview</div>
                </div>
                {!previewURL ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Waiting for dev server...
                  </div>
                ) : (
                  <iframe
                    key={`${iframeKey}-${connectedShellId}`}
                    src={previewURL}
                    className="w-full h-full border rounded-b"
                  />
                )}
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <div className="absolute right-4 top-2 z-10 flex gap-2">
        {showPreview && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            title="Reload preview"
            className="bg-background/80 backdrop-blur-sm shadow-sm border"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={togglePreview}
          title={showPreview ? "Hide Preview" : "Show Preview"}
          className={cn(
            "bg-background/80 backdrop-blur-sm shadow-sm border transition-colors",
            !showPreview && "border-primary text-primary",
          )}
        >
          {showPreview ? (
            <>
              <PanelRightClose className="h-4 w-4 mr-2" />
              Hide Preview
            </>
          ) : (
            <>
              <PanelRightOpen className="h-4 w-4 mr-2" />
              Show Preview
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
