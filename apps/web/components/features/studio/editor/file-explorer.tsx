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
import { Spinner } from "@/components/icons/spinner"
import ShadcnFile from "@/components/icons/shadcn-file"
import { isShadcnComponentPath } from "@/lib/shadcn-components"
import { TextShimmer } from "@/components/ui/text-shimmer"
import React from "react"
import { useActionRequired } from "./context/editor-state"

interface FileTreeItem {
  name: string
  path: string
  type: "file" | "directory"
  children?: FileTreeItem[]
  isUnknownComponent?: boolean
  isLoading?: boolean
  isStyleFile?: boolean
  actionRequired?: boolean
}

export interface FileExplorerProps {
  nonShadcnComponents?: Array<{ name: string; path: string }>
  onFileSelect?: (path: string) => void
  selectedFile?: string | null
  visibleFiles?: string[]
  loadingFiles?: string[]
  loadingStyleFiles?: string[]
}

export function buildFileTree(
  files: string[],
  nonShadcnComponents: Array<{ name: string; path: string }> = [],
  visibleFiles: string[] = [],
  loadingFiles: string[] = [],
  loadingStyleFiles: string[] = [],
  actionRequiredFiles: string[] = [],
) {
  const root: FileTreeItem[] = []
  const directories = new Set<string>()

  const isFileVisible = (path: string) => {
    if (nonShadcnComponents.some((comp) => comp.path === path)) {
      return true
    }

    if (loadingFiles.includes(path)) {
      return true
    }

    if (loadingStyleFiles.includes(path)) {
      return true
    }

    if (!visibleFiles || visibleFiles.length === 0) {
      return true
    }

    return visibleFiles.some((visiblePath) => {
      if (visiblePath.endsWith("/")) {
        return path.startsWith(visiblePath)
      }
      return path === visiblePath
    })
  }

  const addToTree = (
    path: string,
    isUnknownComponent = false,
    componentName?: string,
    isStyleFile = false,
  ) => {
    if (!isUnknownComponent && !isStyleFile && !isFileVisible(path)) {
      return
    }

    const parts = path.replace("@/", "").split("/").filter(Boolean)
    let current = root
    let currentPath = ""

    parts.forEach((part, index) => {
      currentPath += `/${part}`
      const isLast = index === parts.length - 1
      const displayName =
        isLast && isUnknownComponent ? `${componentName || part}.tsx` : part
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
          if (isStyleFile) {
            existingItem.isStyleFile = true
          }
          existingItem.isLoading =
            loadingFiles.includes(path) || loadingStyleFiles.includes(path)
          existingItem.actionRequired = actionRequiredFiles.includes(path)
        }
        current = existingItem.children || []
      } else {
        const newItem: FileTreeItem = {
          name: displayName,
          path: isLast ? path : currentPath,
          type: isLast ? "file" : "directory",
          children: isLast ? undefined : [],
          isUnknownComponent: isLast ? isUnknownComponent : undefined,
          isStyleFile: isLast ? isStyleFile : undefined,
          isLoading: isLast
            ? loadingFiles.includes(path) || loadingStyleFiles.includes(path)
            : undefined,
          actionRequired: isLast
            ? actionRequiredFiles.includes(path)
            : undefined,
        }

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

  files.forEach((path) => {
    addToTree(path)
  })

  nonShadcnComponents.forEach((comp) => {
    // Extract component name from path if not provided
    const pathParts = comp.path.split("/")
    const fileName = pathParts[pathParts.length - 1]
    addToTree(comp.path, true, comp.name || fileName)
  })

  loadingFiles.forEach((path) => {
    const pathParts = path.split("/")
    const fileName = pathParts[pathParts.length - 1] || ""
    const componentName = fileName.replace(".tsx", "")
    addToTree(path, false, componentName)
  })

  loadingStyleFiles.forEach((path) => {
    addToTree(path, false, "", true)
  })

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

  sortTreeRecursively(root)

  return { tree: root, directories }
}

function FileTreeNode({
  item,
  onFileClick,
  expandedDirs,
  onToggleDir,
  isLoading,
  isStyleLoading,
  isActionRequired,
  activeFile,
  level = 0,
}: {
  item: FileTreeItem
  onFileClick: (path: string) => void
  expandedDirs: Set<string>
  onToggleDir: (path: string) => void
  isLoading: (path: string) => boolean
  isStyleLoading: (path: string) => boolean
  isActionRequired: (path: string) => boolean
  activeFile?: string
  level?: number
}) {
  const isExpanded = expandedDirs.has(item.path)
  const { getActionDetails } = useActionRequired()

  // Normalize both paths for comparison to ensure proper highlighting
  const normalizedItemPath = item.path.replace(/^@\//, "/")
  const normalizedActiveFile = activeFile?.replace(/^@\//, "/")
  const isActive = normalizedActiveFile === normalizedItemPath

  const isShadcnFile = item.type === "file" && isShadcnComponentPath(item.path)
  const isTailwindConfig = item.path === "/tailwind.config.js"
  const isGlobalsCss = item.path === "/globals.css"

  // Check if file truly needs action - only for styles or other issues, not for missing_import
  const actionDetails = item.path && getActionDetails(item.path)

  // Log action details for debugging
  if (actionDetails) {
    console.log(`[FileExplorer] File ${item.path} requires action:`, {
      reason: actionDetails.reason,
      message: actionDetails.message,
      isUnknownComponent: item.isUnknownComponent,
    })
  }

  const needsAction = actionDetails && actionDetails.reason !== "missing_import"

  // Use same condition for both icon and text highlighting
  const showWarning = needsAction || item.isUnknownComponent

  const handleClick = () => {
    console.log("[FileTreeNode] Item clicked", {
      path: item.path,
      type: item.type,
      isUnknownComponent: item.isUnknownComponent,
      actionDetails: actionDetails,
      showWarning,
    })

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
          isActive && "bg-muted text-primary font-medium",
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
        {item.type === "directory" ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500" />
          )
        ) : item.isLoading || isLoading(item.path) ? (
          <div className="h-4 w-4 flex items-center justify-center">
            <Spinner size={14} />
          </div>
        ) : isStyleLoading(item.path) ? (
          <div className="h-4 w-4 flex items-center justify-center">
            <Spinner size={14} color="#3b82f6" />
          </div>
        ) : showWarning ? (
          <FileWarning className="h-4 w-4 text-yellow-500" />
        ) : isShadcnFile ? (
          <ShadcnFile className="h-4 w-4 text-primary" />
        ) : isTailwindConfig ? (
          <File className="h-4 w-4 text-emerald-500" />
        ) : isGlobalsCss ? (
          <File className="h-4 w-4 text-blue-500" />
        ) : (
          <File className="h-4 w-4 text-gray-500" />
        )}
        {item.isLoading || isLoading(item.path) || isStyleLoading(item.path) ? (
          <TextShimmer className="truncate text-sm">{item.name}</TextShimmer>
        ) : (
          <span className={cn("truncate", showWarning && "text-yellow-600")}>
            {item.name}
          </span>
        )}
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
              isLoading={isLoading}
              isStyleLoading={isStyleLoading}
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
  nonShadcnComponents = [],
  onFileSelect,
  selectedFile,
  visibleFiles,
  loadingFiles = [],
  loadingStyleFiles = [],
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
        nonShadcnComponents,
        visibleFiles,
        loadingFiles,
        loadingStyleFiles,
        actionRequiredFilesList,
      ),
    [
      sandpackVisibleFiles,
      nonShadcnComponents,
      visibleFiles,
      loadingFiles,
      loadingStyleFiles,
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
        onFileSelect(path)
      }
    },
    [onFileSelect],
  )

  // Check if a file is a loading file
  const isFileLoading = useCallback(
    (filePath: string) => {
      return loadingFiles.includes(filePath)
    },
    [loadingFiles],
  )

  // Check if a file is a loading style file
  const isStyleFileLoading = useCallback(
    (filePath: string) => {
      return loadingStyleFiles.includes(filePath)
    },
    [loadingStyleFiles],
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
            isStyleLoading={isStyleFileLoading}
            isActionRequired={isFileActionRequired}
            activeFile={selectedFile || undefined}
          />
        ))}
      </div>
    </div>
  )
}
