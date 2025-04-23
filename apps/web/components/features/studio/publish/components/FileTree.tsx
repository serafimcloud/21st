import { useState } from "react"
import { FolderIcon, FileIcon, Loader2Icon, TrashIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FileEntry {
  name: string
  type: "file" | "dir"
  path: string
  isSymlink: boolean
}

interface FileTreeProps {
  entries: FileEntry[]
  onSelect: (entry: FileEntry) => void
  selectedPath: string | null
  onDelete: (filePath: string) => void
  isLoading: boolean
  fetchDirectoryContent: (dirPath: string) => Promise<FileEntry[]>
}

export function FileTree({
  entries,
  onSelect,
  selectedPath,
  onDelete,
  isLoading,
  fetchDirectoryContent,
}: FileTreeProps) {
  const [expandedDirs, setExpandedDirs] = useState<Record<string, FileEntry[]>>(
    {},
  )
  const [loadingDirs, setLoadingDirs] = useState<Record<string, boolean>>({})

  const handleFileClick = (entry: FileEntry) => {
    onSelect(entry)
  }

  const handleDirClick = async (entry: FileEntry, e: React.MouseEvent) => {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey
    if (!expandedDirs[entry.path] || isCtrlOrCmd) {
      try {
        setLoadingDirs((prev) => ({ ...prev, [entry.path]: true }))
        const dirContents = await fetchDirectoryContent(entry.path)
        setExpandedDirs((prev) => ({ ...prev, [entry.path]: dirContents }))
      } catch (error) {
        console.error(`Failed to load contents of ${entry.path}:`, error)
      } finally {
        setLoadingDirs((prev) => ({ ...prev, [entry.path]: false }))
      }
    } else {
      setExpandedDirs((prev) => {
        const { [entry.path]: _, ...rest } = prev
        return rest
      })
    }
  }

  if (isLoading && entries.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const renderEntries = (items: FileEntry[], currentLevel = 0) => (
    <ul className={`text-sm py-1 ${currentLevel > 0 ? "pl-4" : ""}`}>
      {items.map((entry) => (
        <li key={entry.path} className="py-0.5">
          {entry.type === "dir" ? (
            <details className="group" open={!!expandedDirs[entry.path]}>
              <summary
                className={`flex items-center px-2 py-1 cursor-pointer hover:bg-muted rounded list-none ${
                  selectedPath === entry.path ? "bg-accent" : ""
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  handleDirClick(entry, e)
                }}
              >
                <FolderIcon className="h-4 w-4 mr-1 text-blue-500 flex-shrink-0" />
                <span className="font-medium truncate" title={entry.name}>
                  {entry.name}
                </span>
                {loadingDirs[entry.path] && (
                  <Loader2Icon className="h-3 w-3 ml-auto animate-spin flex-shrink-0" />
                )}
              </summary>
              {expandedDirs[entry.path] && (
                <div className="mt-1">
                  {(() => {
                    const content = expandedDirs[entry.path]
                    if (content && content.length > 0) {
                      return renderEntries(content, currentLevel + 1)
                    } else {
                      return (
                        <div className="text-xs text-muted-foreground px-2 py-1 pl-6">
                          Empty directory
                        </div>
                      )
                    }
                  })()}
                </div>
              )}
            </details>
          ) : (
            <div className="flex items-center group">
              <button
                className={`flex items-center w-full text-left px-2 py-1 hover:bg-muted rounded truncate ${
                  selectedPath === entry.path ? "bg-accent font-medium" : ""
                }`}
                onClick={() => handleFileClick(entry)}
                title={entry.path}
              >
                <FileIcon className="h-4 w-4 mr-1 text-gray-500 flex-shrink-0" />
                {entry.name}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  >
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
          )}
        </li>
      ))}
      {items.length === 0 && currentLevel === 0 && !isLoading && (
        <li className="px-2 text-muted-foreground">No files found</li>
      )}
    </ul>
  )

  return renderEntries(entries)
}
