import React, { useEffect, useRef } from "react"
import {
  SandpackCodeEditor,
  useActiveCode,
  useSandpack,
} from "@codesandbox/sandpack-react"
import { useCodeManager } from "./code-manager"

interface CodeEditorProps {
  onCodeChange?: (code: string) => void
  componentPath: string
}

export function CodeEditor({ onCodeChange, componentPath }: CodeEditorProps) {
  const { code } = useActiveCode()
  const { sandpack } = useSandpack()
  const prevCodeRef = useRef<string>()
  const updatingRef = useRef(false)

  // Try to use CodeManager if available (for the new flow)
  let codeManager
  try {
    codeManager = useCodeManager()
  } catch (error) {
    // No code manager available, will use the original flow
    codeManager = null
  }

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
    usingCodeManager: Boolean(codeManager),
    updating: updatingRef.current,
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

  // Handle code changes with or without CodeManager
  useEffect(() => {
    // Skip if we're in the middle of updating
    if (updatingRef.current) {
      console.log(
        "[CodeEditor] Skipping update because we're in the middle of updating",
      )
      return
    }

    // Skip if code is the same as before
    if (prevCodeRef.current === code) {
      console.log("[CodeEditor] Skipping update because code is the same")
      return
    }

    // Update the previous code ref
    prevCodeRef.current = code

    if (code && sandpack.activeFile === componentPath) {
      console.log("[CodeEditor] Updating code for:", {
        file: componentPath,
        codeLength: code.length,
        activeFile: sandpack.activeFile,
        codePreview: code.slice(0, 50) + "...",
        usingCodeManager: Boolean(codeManager),
        stackTrace: new Error().stack,
      })

      // If we have a code manager, update it
      if (codeManager && componentPath) {
        try {
          // Set the updating flag to prevent infinite loops
          updatingRef.current = true

          // Update the file content
          codeManager.updateFileContent(componentPath, code)

          // Clear the updating flag after a short delay
          setTimeout(() => {
            updatingRef.current = false
          }, 50)
        } catch (error) {
          console.error("[CodeEditor] Error updating file content:", error)
          updatingRef.current = false
        }
      }

      // Always call the original onCodeChange prop if provided
      if (onCodeChange) {
        onCodeChange(code)
      }
    } else {
      console.log("[CodeEditor] Skipped code update because:", {
        hasCode: Boolean(code),
        activeFile: sandpack.activeFile,
        expectedPath: componentPath,
        matches: sandpack.activeFile === componentPath,
        codePreview: code?.slice(0, 50) + "...",
      })
    }
  }, [code, onCodeChange, sandpack.activeFile, componentPath, codeManager])

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
