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
import { FileEntry } from "../hooks/use-file-system"
import { FolderIcon, FolderOpenIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileTree } from "./file-tree"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import { AddRegistryModal } from "./add-registry-modal"

interface FileExplorerProps {
  entries: FileEntry[]
  onSelect: (entry: FileEntry) => void
  selectedPath: string | null
  onDelete: (filePath: string) => void
  onCreateFile: (fileName: string) => void
  onCreateDirectory: (dirName: string) => void
  onRename: (oldPath: string, newName: string) => Promise<string>
  onRefresh: () => void
  isLoading: boolean
  advancedView: boolean
  onToggleAdvancedView: () => void
  onAddFrom21Registry: (jsonUrl: string) => Promise<void>
}

export function FileExplorer({
  entries,
  onSelect,
  selectedPath,
  onDelete,
  onCreateFile,
  onCreateDirectory,
  onRename,
  onRefresh,
  isLoading,
  advancedView,
  onToggleAdvancedView,
  onAddFrom21Registry,
}: FileExplorerProps) {
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const [isCreatingDirectory, setIsCreatingDirectory] = useState(false)
  const [newDirectoryName, setNewDirectoryName] = useState("")
  const [isAddRegistryModalOpen, setIsAddRegistryModalOpen] = useState(false)

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
    <div className="h-full flex flex-col relative px-1">
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

      <div className="overflow-y-auto flex-1">
        <FileTree
          entries={entries}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onDelete={onDelete}
          isLoading={isLoading}
          onCreateFile={onCreateFile}
          onCreateDirectory={onCreateDirectory}
          onRename={onRename}
        />
      </div>

      <motion.div
        className="absolute bottom-4 left-4 z-10 rounded-full overflow-hidden transition-all duration-200 ease-in-out w-auto"
        initial={{ opacity: 0.95 }}
        whileHover={{
          opacity: 1,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
        transition={{ duration: 0.15 }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleAdvancedView}
          className={cn(
            "bg-background/90 backdrop-blur-md shadow-sm border rounded-full pl-1.5 pr-3 h-8",
            "flex items-center gap-1.5 transition-all duration-200 ease-in-out w-auto",
            advancedView ? "border-primary/30" : "border-muted-foreground/30",
          )}
          disabled={isLoading}
        >
          <motion.div
            initial={false}
            animate={{
              rotateY: advancedView ? 180 : 0,
              backgroundColor: advancedView
                ? "rgba(var(--primary), 0.1)"
                : "hsl(var(--muted))",
            }}
            transition={{ duration: 0.3 }}
            className={cn(
              "rounded-full flex items-center justify-center w-5 h-5",
              advancedView ? "text-primary" : "text-muted-foreground",
            )}
            style={{ transformStyle: "preserve-3d" }}
          >
            {advancedView ? (
              <FolderOpenIcon
                className="h-3 w-3 absolute transform"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              />
            ) : (
              <FolderIcon
                className="h-3 w-3 absolute transform"
                style={{ backfaceVisibility: "hidden" }}
              />
            )}
          </motion.div>
          <span className="text-xs font-medium whitespace-nowrap">
            {advancedView ? "Hide system files" : "Show all files"}
          </span>
        </Button>
      </motion.div>

      <motion.div
        className="absolute bottom-[calc(2.5rem+0.5rem+0.5rem)] left-4 z-10 rounded-full overflow-hidden transition-all duration-200 ease-in-out w-auto"
        initial={{ opacity: 0.95 }}
        whileHover={{
          opacity: 1,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
        transition={{ duration: 0.15 }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddRegistryModalOpen(true)}
          className={cn(
            "bg-background/90 backdrop-blur-md shadow-sm border rounded-full pl-1.5 pr-3 h-8",
            "flex items-center gap-1.5 transition-all duration-200 ease-in-out w-auto",
            "border-muted-foreground/30 hover:border-primary/30",
          )}
          disabled={isLoading}
          title="Add from Registry"
        >
          <motion.div
            className={cn(
              "rounded-full flex items-center justify-center w-5 h-5 bg-muted text-muted-foreground",
            )}
          >
            <PlusIcon className="h-3 w-3" />
          </motion.div>
          <span className="text-xs font-medium whitespace-nowrap">
            Add from Registry
          </span>
        </Button>
      </motion.div>

      {isAddRegistryModalOpen && (
        <AddRegistryModal
          onAddFrom21Registry={onAddFrom21Registry}
          isOpen={isAddRegistryModalOpen}
          onClose={() => setIsAddRegistryModalOpen(false)}
        />
      )}
    </div>
  )
}
