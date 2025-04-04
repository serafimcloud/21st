import { useSandpack } from "@codesandbox/sandpack-react"
import { cn } from "@/lib/utils"
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  FileWarning,
} from "lucide-react"
import { useState, useMemo, useCallback } from "react"

interface FileTreeItem {
  name: string
  path: string
  type: "file" | "directory"
  children?: FileTreeItem[]
  isUnknownComponent?: boolean
}

interface CustomFileExplorerProps {
  nonShadcnComponents?: Array<{ name: string; path: string }>
  onCustomComponentClick?: (componentName: string) => void
  onFileSelect?: (path: string) => void
  selectedFile?: string | null
}

function buildFileTree(
  files: string[],
  unknownComponents: Array<{ name: string; path: string }> = [],
): {
  tree: FileTreeItem[]
  directories: Set<string>
} {
  const root: FileTreeItem[] = []
  const directories = new Set<string>()

  // Helper function to add item to tree
  const addToTree = (
    path: string,
    isUnknownComponent = false,
    componentName?: string,
  ) => {
    const parts = path.replace("@/", "").split("/").filter(Boolean)
    let current = root
    let currentPath = ""

    parts.forEach((part, index) => {
      currentPath += `/${part}`
      const isLast = index === parts.length - 1
      const displayName =
        isLast && isUnknownComponent
          ? `${componentName?.toLowerCase()}.tsx`
          : part
      const existingItem = current.find((item) => item.name === displayName)

      if (!isLast) {
        directories.add(currentPath)
      }

      if (existingItem) {
        if (isLast) {
          existingItem.type = "file"
          existingItem.path = path
          if (isUnknownComponent) {
            existingItem.isUnknownComponent = true
          }
        }
        current = existingItem.children || []
      } else {
        const newItem: FileTreeItem = {
          name: displayName,
          path: isLast ? path : currentPath,
          type: isLast ? "file" : "directory",
          children: isLast ? undefined : [],
          isUnknownComponent: isLast ? isUnknownComponent : undefined,
        }

        // Insert item in sorted position
        const insertIndex = current.findIndex((item) => {
          if (item.type === newItem.type) {
            return item.name.localeCompare(newItem.name) > 0
          }
          return item.type === "file"
        })

        if (insertIndex === -1) {
          current.push(newItem)
        } else {
          current.splice(insertIndex, 0, newItem)
        }

        if (!isLast) {
          current = newItem.children!
        }
      }
    })
  }

  // Add standard files
  files.forEach((path) => {
    addToTree(path)
  })

  // Add unknown components to their respective directories
  unknownComponents.forEach((comp) => {
    addToTree(comp.path, true, comp.name)
  })

  // Helper function to sort children recursively
  const sortTreeRecursively = (items: FileTreeItem[]) => {
    items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

    items.forEach((item) => {
      if (item.children) {
        sortTreeRecursively(item.children)
      }
    })
  }

  // Sort the entire tree
  sortTreeRecursively(root)

  return { tree: root, directories }
}

function FileTreeNode({
  item,
  level = 0,
  activeFile,
  onFileClick,
  expandedDirs,
  onToggleDir,
  onCustomComponentClick,
}: {
  item: FileTreeItem
  level?: number
  activeFile: string
  onFileClick: (path: string) => void
  expandedDirs: Set<string>
  onToggleDir: (path: string) => void
  onCustomComponentClick?: (componentName: string) => void
}) {
  const isExpanded = expandedDirs.has(item.path)
  const isActive = activeFile === item.path

  return (
    <div>
      <button
        className={cn(
          "w-full text-left py-1.5 text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors",
          isActive && "bg-muted text-primary font-medium",
          item.isUnknownComponent && isActive && "bg-yellow-500/10",
        )}
        style={{ paddingLeft: `${level * 12 + 16}px` }}
        onClick={() => {
          if (item.type === "directory") {
            onToggleDir(item.path)
          } else if (item.isUnknownComponent && onCustomComponentClick) {
            onCustomComponentClick(item.name.replace(".tsx", ""))
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
        ) : item.isUnknownComponent ? (
          <FileWarning className="h-4 w-4 text-yellow-500" />
        ) : (
          <File className="h-4 w-4 text-gray-500" />
        )}
        <span
          className={cn(
            "truncate",
            item.isUnknownComponent && "text-yellow-600",
          )}
        >
          {item.name}
        </span>
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
              onCustomComponentClick={onCustomComponentClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CustomFileExplorer({
  nonShadcnComponents = [],
  onCustomComponentClick,
  onFileSelect,
  selectedFile,
}: CustomFileExplorerProps) {
  const { sandpack } = useSandpack()
  const { visibleFiles } = sandpack

  const { tree: fileTree, directories } = useMemo(
    () => buildFileTree(visibleFiles, nonShadcnComponents),
    [visibleFiles, nonShadcnComponents],
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

  const handleFileClick = useCallback(
    (path: string) => {
      if (onFileSelect) {
        onFileSelect(path)
      }
    },
    [onFileSelect],
  )

  return (
    <div className="w-[200px] overflow-auto border-r border-border">
      <div className="p-2 text-sm font-medium text-muted-foreground">Files</div>
      <div className="space-y-1">
        {fileTree.map((item, index) => (
          <FileTreeNode
            key={item.path + index}
            item={item}
            activeFile={selectedFile || ""}
            onFileClick={handleFileClick}
            expandedDirs={expandedDirs}
            onToggleDir={handleToggleDir}
            onCustomComponentClick={onCustomComponentClick}
          />
        ))}
      </div>
    </div>
  )
}
