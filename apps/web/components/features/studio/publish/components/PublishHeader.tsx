import { Button } from "@/components/ui/button"
import { PanelRightOpen, PanelRightClose } from "lucide-react"

interface PublishHeaderProps {
  sandboxId: string | null
  onReset: () => void
  isPreviewVisible: boolean
  onTogglePreview: () => void
}

export function PublishHeader({
  sandboxId,
  onReset,
  isPreviewVisible,
  onTogglePreview,
}: PublishHeaderProps) {
  return (
    <header className="flex items-center gap-2 p-4 border-b">
      <h1 className="text-2xl font-bold">Publish Your Sandbox</h1>
      {sandboxId && (
        <span className="text-xs text-muted-foreground ml-2">{sandboxId}</span>
      )}
      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onTogglePreview}
          title={isPreviewVisible ? "Hide Preview" : "Show Preview"}
        >
          {isPreviewVisible ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </Button>
        <Button size="sm" onClick={onReset}>
          Reset
        </Button>
      </div>
    </header>
  )
}
