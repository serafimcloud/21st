import { useEffect } from "react"
import {
  SandpackCodeEditor,
  useActiveCode,
  useSandpack,
} from "@codesandbox/sandpack-react"

interface CodeEditorProps {
  onCodeChange: (code: string) => void
  componentPath: string
}

export function CodeEditor({ onCodeChange, componentPath }: CodeEditorProps) {
  const { code } = useActiveCode()
  const { sandpack } = useSandpack()

  useEffect(() => {
    if (code && sandpack.activeFile === componentPath) {
      onCodeChange(code)
    }
  }, [code, onCodeChange, sandpack.activeFile, componentPath])

  return (
    <SandpackCodeEditor
      showTabs={false}
      showLineNumbers={true}
      showInlineErrors={true}
      className="h-full"
      style={{ height: "100%" }}
      initMode="immediate"
    />
  )
}
