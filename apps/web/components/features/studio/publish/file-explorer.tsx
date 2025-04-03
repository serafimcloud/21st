import { SandpackFileExplorer } from "@codesandbox/sandpack-react"

export function FileExplorer() {
  return (
    <div className="w-64 border-r overflow-auto">
      <div className="p-2 mt-2 text-xs font-medium text-muted-foreground">
        Project Files
      </div>
      <SandpackFileExplorer />
    </div>
  )
}
