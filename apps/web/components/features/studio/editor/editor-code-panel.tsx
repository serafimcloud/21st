import React, { useEffect, useRef } from "react"
import {
  SandpackCodeEditor,
  useActiveCode,
  useSandpack,
} from "@codesandbox/sandpack-react"
import { useCodeManager } from "./context/editor-state"

interface EditorCodePanelProps {
  onCodeChange?: (code: string) => void
  componentPath: string
}

export function EditorCodePanel({
  onCodeChange,
  componentPath,
}: EditorCodePanelProps) {
  const { code } = useActiveCode()
  const { sandpack } = useSandpack()
  const prevCodeRef = useRef<string>(undefined)
  const updatingRef = useRef(false)

  let codeManager
  try {
    codeManager = useCodeManager()
  } catch (error) {
    codeManager = null
  }

  useEffect(() => {
    if (updatingRef.current) {
      return
    }

    if (prevCodeRef.current === code) {
      return
    }

    prevCodeRef.current = code

    if (code && sandpack.activeFile === componentPath) {
      if (codeManager && componentPath) {
        try {
          updatingRef.current = true
          codeManager.updateFileContent(componentPath, code)
          setTimeout(() => {
            updatingRef.current = false
          }, 50)
        } catch (error) {
          updatingRef.current = false
        }
      }

      if (onCodeChange) {
        onCodeChange(code)
      }
    }
  }, [code, onCodeChange, sandpack.activeFile, componentPath, codeManager])

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

interface SimpleEditorProps {
  onChange?: (code: string) => void
}

export function SimpleEditor({ onChange }: SimpleEditorProps) {
  const { code, updateCode } = useActiveCode()

  useEffect(() => {
    if (onChange && code) {
      onChange(code)
    }
  }, [code, onChange])

  return (
    <SandpackCodeEditor
      showTabs={false}
      showLineNumbers={true}
      showInlineErrors={true}
      className="h-full"
      style={{ height: "100%" }}
    />
  )
}
