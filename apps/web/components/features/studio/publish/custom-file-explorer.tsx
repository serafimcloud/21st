import { useSandpack } from "@codesandbox/sandpack-react"
import { cn } from "@/lib/utils"
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
} from "lucide-react"
import { useState, useMemo } from "react"

interface FileTreeItem {
  name: string
  path: string
  type: "file" | "directory"
  children?: FileTreeItem[]
}

function buildFileTree(files: string[]): {
  tree: FileTreeItem[]
  directories: Set<string>
} {
  const root: FileTreeItem[] = []
  const directories = new Set<string>()

  files.forEach((path) => {
    const parts = path.split("/").filter(Boolean)
    let current = root
    let currentPath = ""

    parts.forEach((part, index) => {
      currentPath += `/${part}`
      const isLast = index === parts.length - 1
      const existingItem = current.find((item) => item.name === part)

      if (!isLast) {
        directories.add(currentPath)
      }

      if (existingItem) {
        if (isLast) {
          existingItem.type = "file"
          existingItem.path = path
        }
        current = existingItem.children || []
      } else {
        const newItem: FileTreeItem = {
          name: part,
          path: isLast ? path : currentPath,
          type: isLast ? "file" : "directory",
          children: isLast ? undefined : [],
        }
        current.push(newItem)
        if (!isLast) {
          current = newItem.children!
        }
      }
    })
  })

  return { tree: root, directories }
}

function FileTreeNode({
  item,
  level = 0,
  activeFile,
  onFileClick,
  expandedDirs,
  onToggleDir,
}: {
  item: FileTreeItem
  level?: number
  activeFile: string
  onFileClick: (path: string) => void
  expandedDirs: Set<string>
  onToggleDir: (path: string) => void
}) {
  const isExpanded = expandedDirs.has(item.path)
  const isActive = item.path === activeFile

  return (
    <div>
      <button
        className={cn(
          "w-full text-left py-1.5 text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors",
          isActive && "bg-muted text-primary",
        )}
        style={{ paddingLeft: `${level * 12 + 16}px` }}
        onClick={() => {
          if (item.type === "directory") {
            onToggleDir(item.path)
          } else {
            onFileClick(item.path)
          }
        }}
      >
        {item.type === "directory" && (
          <div className="w-4 h-4 flex items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </div>
        )}
        {item.type === "directory" ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500" />
          )
        ) : (
          <File className="h-4 w-4 text-gray-500" />
        )}
        <span className="truncate">{item.name}</span>
      </button>

      {item.type === "directory" && isExpanded && item.children && (
        <div>
          {item.children.map((child, index) => (
            <FileTreeNode
              key={child.path + index}
              item={child}
              level={level + 1}
              activeFile={activeFile}
              onFileClick={onFileClick}
              expandedDirs={expandedDirs}
              onToggleDir={onToggleDir}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CustomFileExplorer() {
  const { sandpack } = useSandpack()
  const { visibleFiles, activeFile, setActiveFile } = sandpack

  const { tree: fileTree, directories } = useMemo(
    () => buildFileTree(visibleFiles),
    [visibleFiles],
  )

  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(directories)

  const handleToggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  return (
    <div className="w-64 border-r overflow-auto">
      <div className="mt-4 px-4 text-[13px] font-medium text-muted-foreground">
        Project Files
      </div>
      <div className="mt-2">
        {fileTree.map((item, index) => (
          <FileTreeNode
            key={item.path + index}
            item={item}
            activeFile={activeFile}
            onFileClick={setActiveFile}
            expandedDirs={expandedDirs}
            onToggleDir={handleToggleDir}
          />
        ))}
      </div>
    </div>
  )
}
