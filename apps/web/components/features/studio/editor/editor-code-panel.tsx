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

  // Normalize the path
  const normalizedPath = componentPath.replace(/^@\//, "/")

  // Add logging for debugging
  useEffect(() => {
    console.log("[EditorCodePanel] Component mounted/updated", {
      componentPath,
      normalizedPath,
      activeFile: sandpack.activeFile,
      filesInSandpack: Object.keys(sandpack.files),
      isActiveFileExist: normalizedPath
        ? !!sandpack.files[normalizedPath]
        : false,
    })

    // If the file doesn't exist and we have a valid path, create it
    if (normalizedPath && !sandpack.files[normalizedPath] && codeManager) {
      console.log("[EditorCodePanel] Creating missing file:", normalizedPath)
      try {
        // Create the file with placeholder content
        sandpack.addFile(normalizedPath, "// TODO: Implement this component")

        // Set as active file
        sandpack.setActiveFile(normalizedPath)

        // Update the code manager if available
        if (codeManager.addFile) {
          codeManager.addFile(
            normalizedPath,
            "// TODO: Implement this component",
          )
        }
      } catch (error) {
        console.error("[EditorCodePanel] Failed to create file:", error)
      }
    }
  }, [
    componentPath,
    normalizedPath,
    sandpack.activeFile,
    sandpack.files,
    sandpack,
    codeManager,
  ])

  useEffect(() => {
    if (updatingRef.current) {
      return
    }

    if (prevCodeRef.current === code) {
      return
    }

    prevCodeRef.current = code

    if (code && sandpack.activeFile === normalizedPath) {
      console.log("[EditorCodePanel] Code updated", {
        componentPath,
        normalizedPath,
        codeLength: code.length,
        activeFile: sandpack.activeFile,
      })

      if (codeManager && normalizedPath) {
        try {
          updatingRef.current = true
          codeManager.updateFileContent(normalizedPath, code)
          setTimeout(() => {
            updatingRef.current = false
          }, 50)
        } catch (error) {
          console.error("[EditorCodePanel] Error updating file content", error)
          updatingRef.current = false
        }
      }

      if (onCodeChange) {
        onCodeChange(code)
      }
    }
  }, [
    code,
    onCodeChange,
    sandpack.activeFile,
    componentPath,
    normalizedPath,
    codeManager,
  ])

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
  const { code } = useActiveCode()

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
