import { useAtom } from "jotai"
import { activeFileAtom, userModifiedFilesAtom } from "../context/editor-atoms"

/**
 * Simple hook to access editor file state directly
 */
export function useEditorFile() {
  const [activeFile, setActiveFile] = useAtom(activeFileAtom)
  const [userModifiedFiles] = useAtom(userModifiedFilesAtom)

  return {
    activeFile,
    setActiveFile,
    isFileModified: (path: string) => userModifiedFiles[path] || false,
  }
}
