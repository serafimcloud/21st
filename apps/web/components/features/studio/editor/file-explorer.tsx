import { useSandpack } from "@codesandbox/sandpack-react"
import { cn } from "@/lib/utils"
import { arePathsEqual } from "@/lib/utils"
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  FileWarning,
} from "lucide-react"
import { useState, useMemo, useCallback } from "react"
import { Spinner } from "@/components/icons/spinner"
import ShadcnFile from "@/components/icons/shadcn-file"
import { isShadcnComponentPath } from "@/lib/shadcn-components"
import { TextShimmer } from "@/components/ui/text-shimmer"
import React from "react"
import { useActionRequired } from "./context/editor-state"

interface BaseFileTreeItem {
  name: string
  path: string
  type: "file" | "directory"
  children?: FileTreeItem[]
}

interface RegularFileTreeItem extends BaseFileTreeItem {
  type: "file"
  isLoading?: boolean
  actionRequired?: boolean
}

interface DirectoryTreeItem extends BaseFileTreeItem {
  type: "directory"
  children: FileTreeItem[]
}

interface UnknownComponentFileTreeItem extends BaseFileTreeItem {
  type: "file"
  isUnresolvedDependency: true
  isLoading?: boolean
  actionRequired?: boolean
}

type FileTreeItem =
  | RegularFileTreeItem
  | DirectoryTreeItem
  | UnknownComponentFileTreeItem

interface FileExplorerProps {
  /** List of components that need to be imported or created */
  unresolvedDependencies?: Array<{ name: string; path: string }>
  /** Callback when a file is selected */
  onFileSelect?: (path: string) => void
  /** Currently selected file path */
  selectedFile?: string | null
  /** List of files that should be visible in the explorer */
  visibleFiles?: string[]
  /** List of files that are currently loading */
  loadingFiles?: string[]
}

export function buildFileTree(
  files: string[],
  unresolvedDependencies: Array<{ name: string; path: string }> = [],
  visibleFiles: string[] = [],
  loadingFiles: string[] = [],
  actionRequiredFiles: string[] = [],
) {
  const root: FileTreeItem[] = []
  const directories = new Set<string>()

  const isFileVisible = (path: string) => {
    // Всегда показываем нерешенные зависимости
    if (unresolvedDependencies.some((comp) => comp.path === path)) {
      return true
    }

    // Всегда показываем загружающиеся файлы
    if (loadingFiles.includes(path)) {
      return true
    }

    // Показываем только файлы, которые явно указаны в visibleFiles
    return visibleFiles.some((visiblePath) => {
      if (visiblePath.endsWith("/")) {
        return path.startsWith(visiblePath)
      }
      return path === visiblePath
    })
  }

  const addToTree = (
    path: string,
    isUnresolvedDependency = false,
    componentName?: string,
  ) => {
    if (!isFileVisible(path)) {
      return
    }

    const parts = path.replace("@/", "").split("/").filter(Boolean)
    let current = root
    let currentPath = ""

    parts.forEach((part, index) => {
      currentPath += `/${part}`
      const isLast = index === parts.length - 1
      const displayName =
        isLast && isUnresolvedDependency ? `${componentName || part}.tsx` : part

      if (!isLast) {
        directories.add(currentPath)
        // Создаем директорию если её нет
        const existingDir = current.find(
          (item): item is DirectoryTreeItem =>
            item.type === "directory" && item.name === displayName,
        )
        if (existingDir) {
          current = existingDir.children
        } else {
          const newDir: DirectoryTreeItem = {
            name: displayName,
            path: currentPath,
            type: "directory",
            children: [],
          }
          current.push(newDir)
          current = newDir.children
        }
      } else {
        // Создаем файл
        const fileItem = isUnresolvedDependency
          ? {
              name: displayName,
              path,
              type: "file" as const,
              isUnresolvedDependency: true,
              isLoading: loadingFiles.includes(path),
              actionRequired: actionRequiredFiles.includes(path),
            }
          : {
              name: displayName,
              path,
              type: "file" as const,
              isLoading: loadingFiles.includes(path),
              actionRequired: actionRequiredFiles.includes(path),
            }
        current.push(fileItem)
      }
    })
  }

  // Добавляем все файлы в дерево
  files.forEach((path) => {
    addToTree(path)
  })

  // Добавляем неразрешенные зависимости
  unresolvedDependencies.forEach((comp) => {
    const pathParts = comp.path.split("/")
    const fileName = pathParts[pathParts.length - 1]
    addToTree(comp.path, true, comp.name || fileName)
  })

  // Добавляем загружающиеся файлы
  loadingFiles.forEach((path) => {
    if (
      !files.includes(path) &&
      !unresolvedDependencies.some((d) => d.path === path)
    ) {
      const pathParts = path.split("/")
      const fileName = pathParts[pathParts.length - 1] || ""
      const componentName = fileName.replace(".tsx", "")
      addToTree(path, false, componentName)
    }
  })

  // Сортируем дерево рекурсивно
  const sortTreeRecursively = (items: FileTreeItem[]) => {
    items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

    items.forEach((item) => {
      if (item.type === "directory") {
        sortTreeRecursively(item.children)
      }
    })
  }

  sortTreeRecursively(root)

  return { tree: root, directories }
}

function isFileItem(
  item: FileTreeItem,
): item is RegularFileTreeItem | UnknownComponentFileTreeItem {
  return item.type === "file"
}

function FileTreeNode({
  item,
  onFileClick,
  expandedDirs,
  onToggleDir,
  isLoading,
  isActionRequired,
  activeFile,
  level = 0,
}: {
  item: FileTreeItem
  onFileClick: (path: string) => void
  expandedDirs: Set<string>
  onToggleDir: (path: string) => void
  isLoading: (path: string) => boolean
  isActionRequired: (path: string) => boolean
  activeFile?: string
  level?: number
}) {
  const isExpanded = expandedDirs.has(item.path)
  const { getActionDetails } = useActionRequired()

  // Use utility functions for path comparison
  const isActive = activeFile && arePathsEqual(item.path, activeFile)

  const isShadcnFile = item.type === "file" && isShadcnComponentPath(item.path)
  const isTailwindConfig = item.path === "/tailwind.config.js"
  const isGlobalsCss = item.path === "/globals.css"

  // Get action details and determine warning state
  const actionDetails = item.path && getActionDetails(item.path)
  const showWarning = !!actionDetails

  // Determine file icon and state
  const getFileIcon = () => {
    if (item.type === "directory") {
      return isExpanded ? (
        <FolderOpen className="h-4 w-4 text-blue-500" />
      ) : (
        <Folder className="h-4 w-4 text-blue-500" />
      )
    }

    if (isFileItem(item) && (item.isLoading || isLoading(item.path))) {
      return (
        <div className="h-4 w-4 flex items-center justify-center">
          <Spinner size={14} />
        </div>
      )
    }

    if (showWarning) {
      return <FileWarning className="h-4 w-4 text-yellow-500" />
    }

    if (isShadcnFile) {
      return <ShadcnFile className="h-4 w-4 text-primary" />
    }

    if (isTailwindConfig) {
      return <File className="h-4 w-4 text-emerald-500" />
    }

    if (isGlobalsCss) {
      return <File className="h-4 w-4 text-blue-500" />
    }

    return <File className="h-4 w-4 text-gray-500" />
  }

  const handleClick = () => {
    if (item.type === "directory") {
      onToggleDir(item.path)
    } else {
      onFileClick(item.path)
    }
  }

  return (
    <div>
      <button
        className={cn(
          "w-full text-left py-1.5 text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors",
          isActive && "bg-muted",
          showWarning && isActive && "bg-yellow-500/10",
        )}
        style={{ paddingLeft: `${level * 12 + 16}px` }}
        onClick={handleClick}
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
        {getFileIcon()}
        {isFileItem(item) && (item.isLoading || isLoading(item.path)) ? (
          <TextShimmer className="truncate text-sm">{item.name}</TextShimmer>
        ) : (
          <span className={cn("truncate", showWarning && "text-yellow-600")}>
            {item.name}
          </span>
        )}
      </button>

      {item.type === "directory" && isExpanded && (
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
              isLoading={isLoading}
              isActionRequired={isActionRequired}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * FileExplorer component that renders a tree view of files in the SandpackProvider context
 */
export function FileExplorer({
  unresolvedDependencies = [],
  onFileSelect,
  selectedFile,
  visibleFiles,
  loadingFiles = [],
}: FileExplorerProps) {
  const { sandpack } = useSandpack()
  const { visibleFiles: sandpackVisibleFiles } = sandpack
  const { actionRequiredFiles, isActionRequired } = useActionRequired()

  // Convert the actionRequiredFiles record to an array of paths for the file tree
  const actionRequiredFilesList = useMemo(
    () => Object.keys(actionRequiredFiles),
    [actionRequiredFiles],
  )

  const { tree: fileTree, directories } = useMemo(
    () =>
      buildFileTree(
        sandpackVisibleFiles,
        unresolvedDependencies,
        visibleFiles,
        loadingFiles,
        actionRequiredFilesList,
      ),
    [
      sandpackVisibleFiles,
      unresolvedDependencies,
      visibleFiles,
      loadingFiles,
      actionRequiredFilesList,
    ],
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
        console.log("[FileExplorer] File clicked:", {
          path,
          isActionRequired: isActionRequired(path),
        })
        onFileSelect(path)
      }
    },
    [onFileSelect, isActionRequired],
  )

  // Check if a file is a loading file
  const isFileLoading = useCallback(
    (filePath: string) => {
      return loadingFiles.includes(filePath)
    },
    [loadingFiles],
  )

  // Check if a file needs action
  const isFileActionRequired = useCallback(
    (filePath: string) => {
      return isActionRequired(filePath)
    },
    [isActionRequired],
  )

  return (
    <div className="w-64 flex flex-col h-full overflow-auto border-border">
      <div className="p-2 flex justify-between items-center border-b border-border">
        <h3 className="text-sm font-medium">Files</h3>
      </div>
      <div className="flex-1 overflow-auto px-2 py-1">
        {fileTree.map((item) => (
          <FileTreeNode
            key={item.name}
            item={item}
            onFileClick={handleFileClick}
            expandedDirs={expandedDirs}
            onToggleDir={handleToggleDir}
            isLoading={isFileLoading}
            isActionRequired={isFileActionRequired}
            activeFile={selectedFile || undefined}
          />
        ))}
      </div>
    </div>
  )
}
