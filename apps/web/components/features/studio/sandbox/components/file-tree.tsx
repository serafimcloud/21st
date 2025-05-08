import { useState, useEffect } from "react"
import {
  FolderIcon,
  FolderOpenIcon,
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
import { motion } from "motion/react"
import React from "react"

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

// Reusable input form for file/directory creation and renaming
function InlineInputForm({
  placeholder,
  value,
  onChange,
  onSubmit,
  onCancel,
  buttonText = "Create",
  autoFocus = true,
}: {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
  buttonText?: string
  autoFocus?: boolean
}) {
  return (
    <div className="flex gap-1 py-1">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit()
          if (e.key === "Escape") onCancel()
        }}
        className="h-6 text-xs"
        autoFocus={autoFocus}
        onBlur={() => setTimeout(onCancel, 150)}
      />
      <Button size="sm" onClick={onSubmit} disabled={!value}>
        {buttonText}
      </Button>
    </div>
  )
}

// Simple inline input without button - for renaming files/directories
function SimpleInlineInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  autoFocus = true,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
  autoFocus?: boolean
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const selectionAppliedRef = React.useRef(false)

  // Set selection to select text before dot only when first mounted
  useEffect(() => {
    if (!selectionAppliedRef.current && autoFocus && inputRef.current) {
      const dotIndex = value.lastIndexOf(".")
      if (dotIndex > 0) {
        // Select text before the dot
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(0, dotIndex)
            selectionAppliedRef.current = true
          }
        }, 0)
      }
      selectionAppliedRef.current = true
    }
  }, []) // Empty dependency array to run only once on mount

  return (
    <>
      {/* Add custom selection styling */}
      <style jsx global>{`
        .filename-input::selection {
          background-color: rgba(
            0,
            0,
            0,
            0.3
          ); /* Black with opacity for light theme */
          color: inherit; /* Maintain text color */
        }

        /* Dark theme specific styling */
        [data-theme="dark"] .filename-input::selection {
          background-color: rgba(
            255,
            255,
            255,
            0.3
          ); /* White with opacity for dark theme */
          color: white;
        }
      `}</style>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit()
          if (e.key === "Escape") onCancel()
        }}
        className="h-5 pl-1 text-[14px] rounded-none border-0 focus-visible:ring-1 bg-muted filename-input"
        autoFocus={autoFocus}
        onBlur={onSubmit}
      />
    </>
  )
}

// Action buttons for file/directory operations
function TreeItemActions({
  showActions,
  onRename,
  onDelete,
  onCreateFile,
  onCreateDirectory,
  itemType,
  itemName,
}: {
  showActions: boolean
  onRename?: (e: React.MouseEvent) => void
  onDelete: () => void
  onCreateFile?: (e: React.MouseEvent) => void
  onCreateDirectory?: (e: React.MouseEvent) => void
  itemType: "file" | "dir"
  itemName: string
}) {
  const actionClasses = `transition-opacity ${
    showActions ? "opacity-100" : "opacity-0 group-hover/item:opacity-100"
  }`

  return (
    <div className={`flex items-center gap-1 action-icon ${actionClasses}`}>
      {onRename && itemType === "file" && (
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5"
          onClick={onRename}
          title={`Rename ${itemType}`}
        >
          <PencilIcon className="h-3 w-3 text-muted-foreground" />
        </Button>
      )}

      {itemType === "dir" && onCreateFile && (
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5"
          onClick={onCreateFile}
          title="Create file"
        >
          <FilePlusIcon className="h-3 w-3 text-muted-foreground" />
        </Button>
      )}

      {itemType === "dir" && onCreateDirectory && (
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5"
          onClick={onCreateDirectory}
          title="Create directory"
        >
          <FolderPlusIcon className="h-3 w-3 text-muted-foreground" />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5"
            onClick={(e) => e.stopPropagation()}
          >
            <TrashIcon className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={onDelete}
          >
            Delete {itemType}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Component for file entries
function FileItem({
  entry,
  level,
  onSelect,
  selectedPath,
  onDelete,
  onRename,
}: {
  entry: FileEntry
  level: number
  onSelect: (entry: FileEntry) => void
  selectedPath: string | null
  onDelete: (filePath: string) => void
  onRename?: (oldPath: string, newName: string) => Promise<string>
}) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(entry.name)
  const [showActions, setShowActions] = useState(false)

  const handleRename = async () => {
    if (newName && newName !== entry.name && onRename) {
      try {
        await onRename(entry.path, newName)
      } catch (error) {
        // Error handling is done in the hook
      }
    }
    setIsRenaming(false)
  }

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    setNewName(entry.name)
    setIsRenaming(true)
  }

  const cancelRename = () => {
    setIsRenaming(false)
  }

  return (
    <li
      className="py-0.5 group/item relative select-none"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => !isRenaming && setShowActions(false)}
      style={{ paddingLeft: `${level * 1}rem` }}
    >
      {isRenaming ? (
        <div className="flex items-center px-2 py-1">
          <FileIcon className="h-4 w-4 mr-0.5 text-gray-500 flex-shrink-0" />
          <div className="flex-1">
            <SimpleInlineInput
              value={newName}
              onChange={setNewName}
              onSubmit={handleRename}
              onCancel={cancelRename}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <button
            className={`flex items-center flex-1 text-left px-2 py-1 hover:bg-muted rounded truncate select-none ${
              selectedPath === entry.path ? "bg-accent" : ""
            }`}
            onClick={() => onSelect(entry)}
            onDoubleClick={startRename}
            title={entry.path}
          >
            <FileIcon className="h-4 w-4 mr-[6px] text-gray-500 flex-shrink-0" />
            <span>{entry.name}</span>
          </button>

          {/*  <TreeItemActions
            showActions={showActions}
            onRename={startRename}
            onDelete={() => onDelete(entry.path)}
            itemType="file"
            itemName={entry.name}
          /> */}
        </div>
      )}
    </li>
  )
}

// Component for directory entries
function DirectoryItem({
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
}: {
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
}) {
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const [isCreatingDirectory, setIsCreatingDirectory] = useState(false)
  const [newDirectoryName, setNewDirectoryName] = useState("")
  const [showActions, setShowActions] = useState(false)

  const toggleExpanded = (e: React.MouseEvent) => {
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
    }
  }

  const handleCreateDirectory = () => {
    if (newDirectoryName) {
      const parentPath = entry.path === "/" ? "" : entry.path
      onCreateDirectory(`${parentPath}/${newDirectoryName}`)
      setNewDirectoryName("")
      setIsCreatingDirectory(false)
    }
  }

  const startCreateFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsCreatingFile(true)
    setIsCreatingDirectory(false)
  }

  const startCreateDirectory = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsCreatingDirectory(true)
    setIsCreatingFile(false)
  }

  const cancelCreate = () => {
    setIsCreatingFile(false)
    setNewFileName("")
    setIsCreatingDirectory(false)
    setNewDirectoryName("")
  }

  const indentStyle = { paddingLeft: `${level * 1 + 0.5}rem` }
  const childIndentStyle = { paddingLeft: `${(level + 1) * 1 + 0.5}rem` }
  const isExpanded = expandedDirs[entry.path]

  return (
    <li
      className="py-0.5 group/item relative select-none"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        if (!isCreatingFile && !isCreatingDirectory) {
          setShowActions(false)
        }
      }}
    >
      <details className="group select-none" open={isExpanded}>
        <summary
          className={`flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-muted rounded list-none select-none ${
            selectedPath === entry.path ? "bg-accent" : ""
          } relative z-10`}
          onClick={toggleExpanded}
          style={indentStyle}
        >
          <div className="flex items-center overflow-hidden">
            <div className="relative h-4 w-4 mr-[6px] flex-shrink-0">
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={false}
                animate={{ opacity: isExpanded ? 0 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <FolderIcon className="h-4 w-4 text-blue-500" />
              </motion.div>
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={false}
                animate={{ opacity: isExpanded ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <FolderOpenIcon className="h-4 w-4 text-blue-500" />
              </motion.div>
            </div>
            <span className="truncate" title={entry.name}>
              {entry.name}
            </span>
          </div>
          {/* 
              <TreeItemActions
            showActions={showActions}
            onCreateFile={startCreateFile}
            onCreateDirectory={startCreateDirectory}
            onDelete={() => onDelete(entry.path)}
            itemType="dir"
            itemName={entry.name}
          /> */}
        </summary>

        {isCreatingFile && (
          <div className="flex gap-1 py-1" style={childIndentStyle}>
            <InlineInputForm
              placeholder="filename.js"
              value={newFileName}
              onChange={setNewFileName}
              onSubmit={handleCreateFile}
              onCancel={cancelCreate}
            />
          </div>
        )}

        {isCreatingDirectory && (
          <div className="flex gap-1 py-1" style={childIndentStyle}>
            <InlineInputForm
              placeholder="folder-name"
              value={newDirectoryName}
              onChange={setNewDirectoryName}
              onSubmit={handleCreateDirectory}
              onCancel={cancelCreate}
            />
          </div>
        )}

        <div className="mt-0.5 relative">
          {/* Directory connector line */}
          {isExpanded && entry.children && entry.children.length > 0 && (
            <div
              className="absolute left-3 top-0 bottom-0 w-px bg-gray-200/0 dark:bg-gray-700/0 transition-colors duration-200 group-hover:bg-gray-200 group-hover:dark:bg-gray-700"
              style={{ left: `${level * 16 + 10}px` }}
            />
          )}

          {entry.children && entry.children.length > 0 ? (
            <FileList
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
                style={childIndentStyle}
              >
                Empty directory
              </div>
            )
          )}
        </div>
      </details>
    </li>
  )
}

// Renamed from FileTreeRecursive to FileList for clarity
function FileList({
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
}: {
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
}) {
  return (
    <ul className="text-sm py-0.5 relative group/tree select-none">
      {items.map((entry, index) => (
        <div key={entry.path} className="relative">
          {/* Vertical connector line */}
          {index < items.length - 1 && level > 0 && (
            <div
              className="absolute left-0 top-4 bottom-0 w-px bg-gray-200/0 dark:bg-gray-700/0 transition-colors duration-200 group-hover/tree:bg-gray-200 group-hover/tree:dark:bg-gray-700"
              style={{ left: `${(level - 1) * 16 + 10}px` }}
            />
          )}
          {/* Horizontal connector line */}
          {level > 0 && (
            <div
              className="absolute w-4 h-px bg-gray-200/0 dark:bg-gray-700/0 transition-colors duration-200 group-hover/tree:bg-gray-200 group-hover/tree:dark:bg-gray-700"
              style={{
                left: `${(level - 1) * 16 + 10}px`,
                top: "14px",
                zIndex: 0,
              }}
            />
          )}
          {entry.type === "dir" ? (
            <DirectoryItem
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
          ) : (
            <FileItem
              entry={entry}
              level={level}
              onSelect={onSelect}
              selectedPath={selectedPath}
              onDelete={onDelete}
              onRename={onRename}
            />
          )}
        </div>
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

  useEffect(() => {
    if (entries.length > 0 && !isLoading) {
      const allDirPaths = getAllDirectoryPaths(entries)
      const initialExpandedState = allDirPaths.reduce(
        (acc, path) => {
          acc[path] = true
          return acc
        },
        {} as Record<string, boolean>,
      )

      const currentDirPaths = Object.keys(expandedDirs)
      const entriesChanged =
        allDirPaths.length !== currentDirPaths.length ||
        allDirPaths.some((path) => !currentDirPaths.includes(path))

      if (Object.keys(expandedDirs).length === 0 || entriesChanged) {
        setExpandedDirs(initialExpandedState)
      }
    }
  }, [entries, isLoading])

  const getAllDirectoryPaths = (items: FileEntry[]): string[] => {
    let paths: string[] = []
    for (const item of items) {
      if (item.type === "dir") {
        paths.push(item.path)
        if (item.children) {
          paths = paths.concat(getAllDirectoryPaths(item.children))
        }
      }
    }
    return paths
  }

  if (isLoading && entries.length === 0) {
    return (
      <div className="flex justify-center items-center py-8 select-none">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="select-none">
      {entries.length === 0 && !isLoading ? (
        <div className="px-2 text-muted-foreground py-4 text-sm">
          No files found
        </div>
      ) : (
        <FileList
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
    </div>
  )
}
