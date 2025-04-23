import { useState } from "react"
import { FileEntry } from "../api"
import { PlusIcon, RefreshCwIcon, Loader2Icon } from "lucide-react"
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
  onRefresh: () => void
  isLoading: boolean
  fetchDirectoryContent: (dirPath: string) => Promise<FileEntry[]>
}

export function FileExplorer({
  entries,
  onSelect,
  selectedPath,
  onDelete,
  onCreateFile,
  onRefresh,
  isLoading,
  fetchDirectoryContent,
}: FileExplorerProps) {
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const [newFileName, setNewFileName] = useState("")

  const handleCreateFile = () => {
    if (newFileName) {
      onCreateFile(newFileName)
      setNewFileName("")
      setIsCreatingFile(false)
    }
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
                if (e.key === "Escape") {
                  setIsCreatingFile(false)
                  setNewFileName("")
                }
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

      <CardContent className="p-0 overflow-y-auto flex-1">
        <FileTree
          entries={entries}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onDelete={onDelete}
          isLoading={isLoading}
          fetchDirectoryContent={fetchDirectoryContent}
        />
      </CardContent>
    </Card>
  )
}
