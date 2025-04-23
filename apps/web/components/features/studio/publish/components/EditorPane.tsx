import { Loader2Icon } from "lucide-react"
import Editor from "@monaco-editor/react"
import { getMonacoLanguage } from "../utils"

interface EditorPaneProps {
  selectedFile: { path: string; type: string } | null
  code: string
  onCodeChange: (value: string) => void
  isLoading: boolean
}

export function EditorPane({
  selectedFile,
  code,
  onCodeChange,
  isLoading,
}: EditorPaneProps) {
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!selectedFile || selectedFile.type !== "file") {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        {selectedFile && selectedFile.type === "dir"
          ? `Directory: ${selectedFile.path}`
          : "Select a file to start editing"}
      </div>
    )
  }

  return (
    <Editor
      height="100%"
      language={getMonacoLanguage(selectedFile.path)}
      value={code}
      onChange={(value) => onCodeChange(value || "")}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: "on",
        automaticLayout: true,
      }}
      loading={
        <div className="h-full flex items-center justify-center">
          <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    />
  )
}
