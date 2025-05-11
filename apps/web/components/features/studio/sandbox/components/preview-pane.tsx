import { useEffect, useState } from "react"
import { EditorPane } from "./editor-pane"
import { cn } from "@/lib/utils"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useTheme } from "next-themes"

interface PreviewPaneProps {
  previewURL: string | null
  isPreviewVisible?: boolean
  selectedFile?: any
  code?: string
  onCodeChange?: (value: string) => void
  isFileLoading?: boolean
  connectedShellId?: string
  showPreview: boolean
  iframeKey: number
  onRefresh: () => void
}

export function PreviewPane({
  previewURL,
  isPreviewVisible = true,
  selectedFile = null,
  code = "",
  onCodeChange = () => {},
  isFileLoading = false,
  connectedShellId = "",
  showPreview,
  iframeKey,
  onRefresh,
}: PreviewPaneProps) {
  const [previousConnectedShellId, setPreviousConnectedShellId] = useState<
    string | null
  >(connectedShellId)

  const { resolvedTheme } = useTheme()

  //  takes time to complile need to reload iframe, will be fixed at codesandbox SDK team side
  useEffect(() => {
    setPreviousConnectedShellId(connectedShellId)
    if (
      previousConnectedShellId !== connectedShellId &&
      previousConnectedShellId !== ""
    ) {
      setTimeout(() => {
        onRefresh()
      }, 1000 * 8)
    }
  }, [connectedShellId, onRefresh])

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
        <ResizableHandle
          className={cn(
            showPreview ? "opacity-100 scale-100" : "opacity-0 scale-95",
          )}
        />
        <ResizablePanel
          defaultSize={50}
          minSize={30}
          style={{
            maxWidth: showPreview ? "100%" : "0px",
            minWidth: showPreview ? "30%" : "0px",
            opacity: showPreview ? 1 : 0,
            overflow: "hidden",
            transition: "all 450ms cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          <div className="flex flex-col h-full">
            {!previewURL ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Waiting for dev server...
              </div>
            ) : (
              <iframe
                key={`${iframeKey}-${connectedShellId}`}
                src={`${previewURL}?theme=${resolvedTheme}`}
                className="w-full h-full rounded-b"
              />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
