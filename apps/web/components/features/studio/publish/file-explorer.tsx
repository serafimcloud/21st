import { SandpackFileExplorer } from "@codesandbox/sandpack-react"

export function FileExplorer() {
  return (
    <div className="w-64 border-r overflow-auto">
      <div className="mt-4 px-4 text-[13px] font-medium text-muted-foreground">
        Project Files
      </div>
      <SandpackFileExplorer
        autoHiddenFiles={true}
        initialCollapsedFolder={[
          "/node_modules",
          "/lib",
          "/public",
          "/.env",
          "/index.html",
          "/index.tsx",
          "/tsconfig.json",
          "/theme-provider.tsx",
        ]}
      />
    </div>
  )
}
