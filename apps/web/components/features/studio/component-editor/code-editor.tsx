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

  // Log detailed Sandpack state on every render
  console.log("[CodeEditor] Current full state:", {
    sandpackState: {
      activeFile: sandpack.activeFile,
      visibleFiles: sandpack.visibleFiles,
      files: Object.keys(sandpack.files),
      currentCode: code?.slice(0, 100) + "...", // First 100 chars for debugging
    },
    props: {
      componentPath,
      hasCode: Boolean(code),
      codeLength: code?.length,
    },
    stackTrace: new Error().stack,
  })

  // Log when the component renders with new props
  useEffect(() => {
    console.log("[CodeEditor] Rendered with:", {
      componentPath,
      activeFile: sandpack.activeFile,
      hasCode: Boolean(code),
      currentCodePreview: code?.slice(0, 50) + "...", // Show start of the code
      allFiles: Object.keys(sandpack.files),
      fileContent:
        sandpack.files[sandpack.activeFile]?.code?.slice(0, 50) + "...",
    })
  }, [componentPath, sandpack.activeFile, code, sandpack.files])

  useEffect(() => {
    if (code && sandpack.activeFile === componentPath) {
      console.log("[CodeEditor] Updating code for:", {
        file: componentPath,
        codeLength: code.length,
        activeFile: sandpack.activeFile,
        codePreview: code.slice(0, 50) + "...",
        stackTrace: new Error().stack,
      })
      onCodeChange(code)
    } else {
      console.log("[CodeEditor] Skipped code update because:", {
        hasCode: Boolean(code),
        activeFile: sandpack.activeFile,
        expectedPath: componentPath,
        matches: sandpack.activeFile === componentPath,
        codePreview: code?.slice(0, 50) + "...",
      })
    }
  }, [code, onCodeChange, sandpack.activeFile, componentPath])

  // Log when active file changes in Sandpack
  useEffect(() => {
    console.log("[CodeEditor] Sandpack active file changed:", {
      from: sandpack.activeFile,
      expectedPath: componentPath,
      matches: sandpack.activeFile === componentPath,
      currentCode: code?.slice(0, 50) + "...",
      fileContent:
        sandpack.files[sandpack.activeFile]?.code?.slice(0, 50) + "...",
      allFiles: Object.keys(sandpack.files),
      stackTrace: new Error().stack,
    })
  }, [sandpack.activeFile, componentPath, code, sandpack.files])

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
