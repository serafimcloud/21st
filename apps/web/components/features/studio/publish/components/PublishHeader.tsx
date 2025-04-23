import { Button } from "@/components/ui/button"

interface PublishHeaderProps {
  sandboxId: string | null
  onReset: () => void
}

export function PublishHeader({ sandboxId, onReset }: PublishHeaderProps) {
  return (
    <header className="flex items-center gap-2 p-4 border-b">
      <h1 className="text-2xl font-bold">Publish Your Sandbox</h1>
      {sandboxId && (
        <span className="text-xs text-muted-foreground ml-2">{sandboxId}</span>
      )}
      <Button size="sm" onClick={onReset} className="ml-auto">
        Reset
      </Button>
    </header>
  )
}
