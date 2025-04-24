import { useState } from "react"
// Remove import of old FileEntry type
// import { FileEntry } from "../api"
// Define or import the correct FileEntry type if not globally available
// Assuming FileEntry is defined in page.tsx or a shared types file
// If not, define it here:
// Remove the local definition if FileEntry is imported from useFileSystem
/*
interface FileEntry {
  name: string
  type: "file" | "dir"
  path: string
  isSymlink: boolean
  children?: FileEntry[]
}
*/
import { FileEntry } from "../hooks/useFileSystem"
import {
  PlusIcon,
  RefreshCwIcon,
  Loader2Icon,
  FolderPlusIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { FileTree } from "./FileTree"

interface FileExplorerProps {
  entries: FileEntry[]
  onSelect: (entry: FileEntry) => void
  selectedPath: string | null
  onDelete: (filePath: string) => void
  onCreateFile: (fileName: string) => void
  onCreateDirectory: (dirName: string) => void
  onRefresh: () => void
  isLoading: boolean
}

export function FileExplorer({
  entries,
  onSelect,
  selectedPath,
  onDelete,
  onCreateFile,
  onCreateDirectory,
  onRefresh,
  isLoading,
}: FileExplorerProps) {
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const [isCreatingDirectory, setIsCreatingDirectory] = useState(false)
  const [newDirectoryName, setNewDirectoryName] = useState("")

  const handleCreateFile = () => {
    if (newFileName) {
      onCreateFile(newFileName)
      setNewFileName("")
      setIsCreatingFile(false)
    }
  }

  const handleCreateDirectory = () => {
    if (newDirectoryName) {
      onCreateDirectory(newDirectoryName)
      setNewDirectoryName("")
      setIsCreatingDirectory(false)
    }
  }

  const handleCancel = () => {
    setIsCreatingFile(false)
    setNewFileName("")
    setIsCreatingDirectory(false)
    setNewDirectoryName("")
  }

  return (
    <Card className="h-full rounded-none flex flex-col">
      <div className="flex items-center justify-between p-2 border-b">
        <span className="font-medium">Files</span>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsCreatingFile(true)}
            disabled={isLoading}
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsCreatingDirectory(true)}
            disabled={isLoading}
          >
            <FolderPlusIcon className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCwIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {isCreatingFile && (
        <div className="p-2 border-b">
          <div className="flex gap-2">
            <Input
              placeholder="filename.js"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFile()
                if (e.key === "Escape") handleCancel()
              }}
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleCreateFile}
              disabled={!newFileName}
            >
              Create
            </Button>
          </div>
        </div>
      )}

      {isCreatingDirectory && (
        <div className="p-2 border-b">
          <div className="flex gap-2">
            <Input
              placeholder="folder-name"
              value={newDirectoryName}
              onChange={(e) => setNewDirectoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateDirectory()
                if (e.key === "Escape") handleCancel()
              }}
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleCreateDirectory}
              disabled={!newDirectoryName}
            >
              Create
            </Button>
          </div>
        </div>
      )}

      <CardContent className="p-0 overflow-y-auto flex-1">
        <FileTree
          entries={entries}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onDelete={onDelete}
          isLoading={isLoading}
          onCreateFile={onCreateFile}
          onCreateDirectory={onCreateDirectory}
        />
      </CardContent>
    </Card>
  )
}
