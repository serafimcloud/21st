import { Button } from "@/components/ui/button"

interface PublishHeaderProps {
  projectId: string | null
  onReset: () => void
}

export function PublishHeader({ projectId, onReset }: PublishHeaderProps) {
  return (
    <header className="flex items-center gap-2 p-4 border-b">
      <h1 className="text-2xl font-bold">Publish Your Sandbox</h1>
      {projectId && (
        <span className="text-xs text-muted-foreground ml-2">{projectId}</span>
      )}
      <Button size="sm" onClick={onReset} className="ml-auto">
        Reset
      </Button>
    </header>
  )
}
