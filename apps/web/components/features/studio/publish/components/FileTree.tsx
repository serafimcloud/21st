import { useState } from "react"
import {
  FolderIcon,
  FileIcon,
  Loader2Icon,
  TrashIcon,
  FilePlusIcon,
  FolderPlusIcon,
  PencilIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

interface FileEntry {
  name: string
  type: "file" | "dir"
  path: string
  isSymlink: boolean
  children?: FileEntry[]
}

interface FileTreeProps {
  entries: FileEntry[]
  onSelect: (entry: FileEntry) => void
  selectedPath: string | null
  onDelete: (filePath: string) => void
  isLoading: boolean
  onCreateFile: (filePath: string) => void
  onCreateDirectory: (dirPath: string) => void
  onRename?: (oldPath: string, newName: string) => Promise<string>
}

interface FileTreeItemProps {
  entry: FileEntry
  level: number
  onSelect: (entry: FileEntry) => void
  selectedPath: string | null
  onDelete: (filePath: string) => void
  onCreateFile: (filePath: string) => void
  onCreateDirectory: (dirPath: string) => void
  onRename?: (oldPath: string, newName: string) => Promise<string>
  expandedDirs: Record<string, boolean>
  setExpandedDirs: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}

function FileTreeItem({
  entry,
  level,
  onSelect,
  selectedPath,
  onDelete,
  onCreateFile,
  onCreateDirectory,
  onRename,
  expandedDirs,
  setExpandedDirs,
}: FileTreeItemProps) {
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const [isCreatingDirectory, setIsCreatingDirectory] = useState(false)
  const [newDirectoryName, setNewDirectoryName] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState("")
  const [showActions, setShowActions] = useState(false)

  const handleFileClick = () => {
    onSelect(entry)
  }

  const handleDirClick = (e: React.MouseEvent) => {
    // Prevent details toggle when clicking icons
    if ((e.target as HTMLElement).closest(".action-icon")) {
      e.preventDefault()
      return
    }
    e.preventDefault()
    setExpandedDirs((prev) => ({
      ...prev,
      [entry.path]: !prev[entry.path],
    }))
  }

  const handleCreateFile = () => {
    if (newFileName) {
      const parentPath = entry.path === "/" ? "" : entry.path
      onCreateFile(`${parentPath}/${newFileName}`)
      setNewFileName("")
      setIsCreatingFile(false)
      setShowActions(false) // Hide actions after creation
    }
  }

  const handleCreateDirectory = () => {
    if (newDirectoryName) {
      const parentPath = entry.path === "/" ? "" : entry.path
      onCreateDirectory(`${parentPath}/${newDirectoryName}`)
      setNewDirectoryName("")
      setIsCreatingDirectory(false)
      setShowActions(false) // Hide actions after creation
    }
  }

  const handleCancelCreate = () => {
    setIsCreatingFile(false)
    setNewFileName("")
    setIsCreatingDirectory(false)
    setNewDirectoryName("")
    setIsRenaming(false)
  }

  const startCreateFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsCreatingFile(true)
    setIsCreatingDirectory(false) // Ensure only one input is shown
  }

  const startCreateDirectory = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsCreatingDirectory(true)
    setIsCreatingFile(false) // Ensure only one input is shown
  }

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setNewName(entry.name)
    setIsRenaming(true)
  }

  const handleRename = async () => {
    if (newName && newName !== entry.name && onRename) {
      try {
        await onRename(entry.path, newName)
        setIsRenaming(false)
      } catch (error) {
        // Error handling is done in the hook
      }
    } else {
      setIsRenaming(false)
    }
  }

  return (
    <li
      className="py-0.5 group/item"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        // Don't hide actions if an input is active
        if (!isCreatingFile && !isCreatingDirectory && !isRenaming) {
          setShowActions(false)
        }
      }}
    >
      {entry.type === "dir" ? (
        <details className="group" open={expandedDirs[entry.path]}>
          {isRenaming ? (
            <div
              className="flex gap-1 py-1 pl-2"
              style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
            >
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename()
                  if (e.key === "Escape") handleCancelCreate()
                }}
                className="h-6 text-xs"
                autoFocus
                onBlur={() => setTimeout(handleCancelCreate, 150)}
              />
              <Button
                size="sm"
                onClick={handleRename}
                disabled={!newName || newName === entry.name}
              >
                Rename
              </Button>
            </div>
          ) : (
            <summary
              className={`flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-muted rounded list-none ${
                selectedPath === entry.path ? "bg-accent" : ""
              }`}
              onClick={handleDirClick}
              style={{ paddingLeft: `${level * 1 + 0.5}rem` }} // Indentation
            >
              <div className="flex items-center overflow-hidden">
                <FolderIcon className="h-4 w-4 mr-1 text-blue-500 flex-shrink-0" />
                <span className="font-medium truncate" title={entry.name}>
                  {entry.name}
                </span>
              </div>
              <div
                className={`flex items-center gap-1 action-icon transition-opacity ${
                  showActions
                    ? "opacity-100"
                    : "opacity-0 group-hover/item:opacity-100"
                }`}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5"
                  onClick={startRename}
                  title="Rename folder"
                >
                  <PencilIcon className="h-3 w-3 text-muted-foreground" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5"
                  onClick={startCreateFile}
                  title="Create file"
                >
                  <FilePlusIcon className="h-3 w-3 text-muted-foreground" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5"
                  onClick={startCreateDirectory}
                  title="Create directory"
                >
                  <FolderPlusIcon className="h-3 w-3 text-muted-foreground" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      onClick={(e) => e.stopPropagation()} // Prevent summary click
                    >
                      <TrashIcon className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(entry.path)}
                    >
                      Delete folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </summary>
          )}

          {/* Input field for creating file */}
          {isCreatingFile && (
            <div
              className="flex gap-1 py-1 pl-6"
              style={{ paddingLeft: `${(level + 1) * 1 + 0.5}rem` }}
            >
              <Input
                placeholder="filename.js"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFile()
                  if (e.key === "Escape") handleCancelCreate()
                }}
                className="h-6 text-xs"
                autoFocus
                onBlur={() => setTimeout(handleCancelCreate, 150)} // Delay blur to allow button click
              />
              <Button
                size="sm"
                onClick={handleCreateFile}
                disabled={!newFileName}
              >
                Create
              </Button>
            </div>
          )}

          {/* Input field for creating directory */}
          {isCreatingDirectory && (
            <div
              className="flex gap-1 py-1 pl-6"
              style={{ paddingLeft: `${(level + 1) * 1 + 0.5}rem` }}
            >
              <Input
                placeholder="folder-name"
                value={newDirectoryName}
                onChange={(e) => setNewDirectoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateDirectory()
                  if (e.key === "Escape") handleCancelCreate()
                }}
                className="h-6 text-xs"
                autoFocus
                onBlur={() => setTimeout(handleCancelCreate, 150)} // Delay blur to allow button click
              />
              <Button
                size="sm"
                onClick={handleCreateDirectory}
                disabled={!newDirectoryName}
              >
                Create
              </Button>
            </div>
          )}

          {/* Render children */}
          {entry.children && (
            <div className="mt-0.5">
              {entry.children.length > 0 ? (
                <FileTreeRecursive
                  items={entry.children}
                  level={level + 1}
                  onSelect={onSelect}
                  selectedPath={selectedPath}
                  onDelete={onDelete}
                  onCreateFile={onCreateFile}
                  onCreateDirectory={onCreateDirectory}
                  onRename={onRename}
                  expandedDirs={expandedDirs}
                  setExpandedDirs={setExpandedDirs}
                />
              ) : (
                !isCreatingFile &&
                !isCreatingDirectory && (
                  <div
                    className="text-xs text-muted-foreground px-2 py-1"
                    style={{ paddingLeft: `${(level + 1) * 1 + 0.5}rem` }}
                  >
                    Empty directory
                  </div>
                )
              )}
            </div>
          )}
        </details>
      ) : (
        <div
          className="flex items-center group/item justify-between"
          style={{ paddingLeft: `${level * 1 + 0.5}rem` }} // Indentation
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          {isRenaming ? (
            <div className="flex gap-1 py-1 flex-1">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename()
                  if (e.key === "Escape") handleCancelCreate()
                }}
                className="h-6 text-xs"
                autoFocus
                onBlur={() => setTimeout(handleCancelCreate, 150)}
              />
              <Button
                size="sm"
                onClick={handleRename}
                disabled={!newName || newName === entry.name}
              >
                Rename
              </Button>
            </div>
          ) : (
            <>
              <button
                className={`flex items-center flex-1 text-left px-2 py-1 hover:bg-muted rounded truncate ${
                  selectedPath === entry.path ? "bg-accent font-medium" : ""
                }`}
                onClick={handleFileClick}
                title={entry.path}
              >
                <FileIcon className="h-4 w-4 mr-1 text-gray-500 flex-shrink-0" />
                {entry.name}
              </button>
              <div
                className={`action-icon transition-opacity ${
                  showActions
                    ? "opacity-100"
                    : "opacity-0 group-hover/item:opacity-100"
                }`}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5"
                  onClick={startRename}
                  title="Rename file"
                >
                  <PencilIcon className="h-3 w-3 text-muted-foreground" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-5 w-5">
                      <TrashIcon className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(entry.path)}
                    >
                      Delete file
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
      )}
    </li>
  )
}

// Renamed original renderEntries to FileTreeRecursive for clarity
interface FileTreeRecursiveProps {
  items: FileEntry[]
  level: number
  onSelect: (entry: FileEntry) => void
  selectedPath: string | null
  onDelete: (filePath: string) => void
  onCreateFile: (filePath: string) => void
  onCreateDirectory: (dirPath: string) => void
  onRename?: (oldPath: string, newName: string) => Promise<string>
  expandedDirs: Record<string, boolean>
  setExpandedDirs: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}

function FileTreeRecursive({
  items,
  level,
  onSelect,
  selectedPath,
  onDelete,
  onCreateFile,
  onCreateDirectory,
  onRename,
  expandedDirs,
  setExpandedDirs,
}: FileTreeRecursiveProps) {
  return (
    <ul className={`text-sm py-0.5`}>
      {items.map((entry) => (
        <FileTreeItem
          key={entry.path}
          entry={entry}
          level={level}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onDelete={onDelete}
          onCreateFile={onCreateFile}
          onCreateDirectory={onCreateDirectory}
          onRename={onRename}
          expandedDirs={expandedDirs}
          setExpandedDirs={setExpandedDirs}
        />
      ))}
    </ul>
  )
}

export function FileTree({
  entries,
  onSelect,
  selectedPath,
  onDelete,
  isLoading,
  onCreateFile,
  onCreateDirectory,
  onRename,
}: FileTreeProps) {
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({})

  if (isLoading && entries.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      {entries.length === 0 && !isLoading ? (
        <div className="px-2 text-muted-foreground py-4 text-sm">
          No files found
        </div>
      ) : (
        <FileTreeRecursive
          items={entries}
          level={0}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onDelete={onDelete}
          onCreateFile={onCreateFile}
          onCreateDirectory={onCreateDirectory}
          onRename={onRename}
          expandedDirs={expandedDirs}
          setExpandedDirs={setExpandedDirs}
        />
      )}
    </>
  )
}
