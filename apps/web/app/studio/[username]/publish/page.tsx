"use client"

import { useEffect, useState, useRef, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
// Sandpack removed as it's not used directly with the new hook/approach
// import { Sandpack } from "@codesandbox/sandpack-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ResizablePanelGroup, ResizablePanel } from "@/components/ui/resizable"
import Editor from "@monaco-editor/react"
import { Input } from "@/components/ui/input"
import {
  PlusIcon,
  FolderIcon,
  FileIcon,
  RefreshCwIcon,
  TrashIcon,
  Loader2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  useSandbox,
  UseSandboxReturn,
} from "@/components/features/studio/publish/hooks/useSandbox"

// FileEntry from hook - might need adjustment based on final hook structure
type FileEntry = UseSandboxReturn["files"][number]

// Type for the nested structure used by FileTree
interface TreeNode extends FileEntry {
  children?: TreeNode[]
  type: "file" | "dir" // Add type explicitly for rendering
}

// Utility to build nested tree from flat paths
const buildTree = (entries: FileEntry[]): TreeNode[] => {
  const tree: TreeNode[] = []
  const map: { [key: string]: TreeNode } = {} // Map paths to nodes for quick lookup

  // Sort entries to ensure parents are processed before children
  const sortedEntries = [...entries].sort((a, b) =>
    a.path.localeCompare(b.path),
  )

  sortedEntries.forEach((entry) => {
    const pathSegments = entry.path.split("/").filter(Boolean)
    let currentLevel = map
    let currentPath = ""

    pathSegments.forEach((segment: string, index: number) => {
      currentPath = currentPath ? `${currentPath}/${segment}` : `/${segment}` // Construct full path
      const isLastSegment = index === pathSegments.length - 1

      if (!map[currentPath]) {
        const newNode: TreeNode = {
          ...entry, // Spread original entry data (like name from hook)
          name: segment, // Use segment name for display
          path: currentPath, // Use the constructed full path
          type: isLastSegment && entry.path.includes(".") ? "file" : "dir", // Basic type detection
          children: [],
        }
        map[currentPath] = newNode

        // Find parent and add node to its children
        const parentPathSegments = pathSegments.slice(0, index)
        const parentFullPath =
          parentPathSegments.length > 0
            ? `/${parentPathSegments.join("/")}`
            : null

        if (parentFullPath && map[parentFullPath]) {
          if (map[parentFullPath].type === "dir") {
            if (!map[parentFullPath].children) {
              map[parentFullPath].children = []
            }
            map[parentFullPath].children?.push(newNode)
          }
        } else {
          // If no parent found in map, it's a root node
          tree.push(newNode)
        }
      }
      // If it's a directory, ensure it has children array
      if (
        !isLastSegment &&
        map[currentPath].type === "dir" &&
        !map[currentPath].children
      ) {
        map[currentPath].children = []
      }
    })
  })

  // Sort children at each level (directories first, then alphabetically)
  const sortChildren = (nodes: TreeNode[]) => {
    nodes.sort((a: TreeNode, b: TreeNode) => {
      // Compare types using non-null assertion
      if (a!.type === "dir" && b!.type === "file") return -1
      if (a!.type === "file" && b!.type === "dir") return 1

      // Compare names using non-null assertion
      return a!.name.localeCompare(b!.name)
    })
    nodes.forEach((node) => {
      // Check if children exist before sorting them - simplified check
      if (node?.children?.length) {
        sortChildren(node.children)
      }
    })
  }

  sortChildren(tree)
  return tree
}

// Utility Functions (getFileExtension, getMonacoLanguage) remain the same
// ... (keep existing getFileExtension and getMonacoLanguage)
const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2)
}

const getMonacoLanguage = (filename: string) => {
  const ext = getFileExtension(filename).toLowerCase()

  switch (ext) {
    case "js":
      return "javascript"
    case "jsx":
      return "javascript"
    case "ts":
      return "typescript"
    case "tsx":
      return "typescript"
    case "html":
    case "htm":
    case "svg":
    case "xml":
      return "html"
    case "css":
    case "scss":
    case "sass":
    case "less":
      return "css"
    case "json":
      return "json"
    default:
      return "javascript"
  }
}

// Main Component Content
function PublishPageContent() {
  // Use the custom hook
  const {
    projectId,
    previewURL,
    files, // This is now the flat list from the hook
    selectedEntry,
    code,
    isInitializing,
    isFetchingTree, // Use the renamed state from the hook
    isFileLoading,
    setSelectedEntry,
    handleCodeChange,
    createNewFile: hookCreateNewFile,
    deleteFile: hookDeleteFile,
    refreshFileTree,
  } = useSandbox()

  const [newFileName, setNewFileName] = useState("")
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  // Local state for the tree structure derived from flat 'files'
  const fileTree = useMemo(() => buildTree(files), [files])

  // Handle file creation input
  const handleCreateFile = async () => {
    if (!newFileName) return
    setIsCreatingFile(true)
    const createdPath = await hookCreateNewFile(newFileName)
    if (createdPath) {
      // Find the newly created entry in the updated flat list
      // Note: refreshFileTree should update 'files', triggering re-render
      // We might need a brief delay or check if 'files' includes the new path
      // before trying to select it.
      const newEntry = files.find((f: FileEntry) => f.path === createdPath)
      if (newEntry) {
        setSelectedEntry(newEntry) // Select the new file
      }
      setNewFileName("")
    }
    setIsCreatingFile(false) // Ensure this resets even on failure
  }

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2Icon className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">Initializing sandbox...</p>
        </div>
      </div>
    )
  }

  // Determine language for Monaco based on selectedEntry path
  const editorLanguage = selectedEntry?.path
    ? getMonacoLanguage(selectedEntry.path)
    : "plaintext"
  // Determine if the selected entry is considered a file (for editor display)
  const isSelectedFile = selectedEntry?.path
    ? selectedEntry.path.includes(".") || !selectedEntry.path.endsWith("/")
    : false

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 p-4 border-b">
        <h1 className="text-2xl font-bold">Publish Your Sandbox</h1>
        {projectId && (
          <span className="text-xs text-muted-foreground ml-2">
            {projectId}
          </span>
        )}
        <Button
          size="sm"
          onClick={() => window.location.reload()} // Keep simple reload for now
          className="ml-auto"
        >
          Reset
        </Button>
      </header>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* File Explorer */}
        <ResizablePanel defaultSize={20} minSize={15} className="border-r">
          <Card className="h-full rounded-none flex flex-col">
            <div className="flex items-center justify-between p-2 border-b">
              <span className="font-medium">Files</span>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsCreatingFile(true)} // Toggle input visibility
                  disabled={isFetchingTree} // Use hook state
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={refreshFileTree} // Use hook function
                  disabled={isFetchingTree} // Use hook state
                >
                  {isFetchingTree ? (
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
                    placeholder="path/filename.js" // Update placeholder
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
                    disabled={!newFileName || isCreatingFile}
                  >
                    {isCreatingFile ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      "Create"
                    )}
                  </Button>
                </div>
              </div>
            )}

            <CardContent className="p-0 overflow-y-auto flex-1">
              {/* Pass the generated tree and use hook functions */}
              <FileTree
                treeNodes={fileTree}
                onSelect={setSelectedEntry} // Use hook setter
                selectedPath={selectedEntry?.path || null}
                onDelete={hookDeleteFile} // Use hook delete function
                isLoading={isFetchingTree} // Use hook loading state
              />
            </CardContent>
          </Card>
        </ResizablePanel>

        {/* Editor + Preview */}
        <ResizablePanel defaultSize={80} minSize={55}>
          <Tabs defaultValue="editor" className="h-full flex flex-col">
            <TabsList className="mx-2 mt-2">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview" disabled={!previewURL}>
                Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="flex-1 min-h-0 p-2">
              {isFileLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : // Use derived state to check if it's a file
              isSelectedFile ? (
                <Editor
                  height="100%"
                  language={editorLanguage}
                  value={code}
                  onChange={(value) => handleCodeChange(value || "")}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: "on",
                    automaticLayout: true,
                  }}
                  loading={
                    <div className="h-full flex items-center justify-center">
                      <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  }
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  {selectedEntry
                    ? `Directory: ${selectedEntry.path}` // Show path for directories
                    : "Select a file to start editing"}
                </div>
              )}
            </TabsContent>
            <TabsContent value="preview" className="flex-1 min-h-0 p-2">
              {previewURL ? (
                <iframe
                  src={previewURL}
                  className="w-full h-full border rounded"
                  title="Sandbox Preview"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Waiting for dev server...
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

// Wrap the main component with Suspense for useSearchParams
export default function PublishPage() {
  return (
    <Suspense fallback={<div>Loading project...</div>}>
      <PublishPageContent />
    </Suspense>
  )
}

// FileTree Component - Reworked for nested structure
function FileTree({
  treeNodes, // Now receives the pre-built nested tree
  onSelect,
  selectedPath,
  onDelete,
  isLoading,
}: {
  treeNodes: TreeNode[]
  onSelect: (entry: FileEntry) => void // onSelect expects the original flat FileEntry
  selectedPath: string | null
  onDelete: (filePath: string) => void
  isLoading: boolean
}) {
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({})

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => ({ ...prev, [path]: !prev[path] }))
  }

  // Recursive function to render nodes
  const renderNode = (node: TreeNode, level: number) => {
    const isExpanded = expandedDirs[node.path]

    if (node.type === "dir") {
      return (
        <li key={node.path} className={`py-0.5 ${level > 0 ? "ml-4" : ""}`}>
          <div className="flex items-center group">
            <button
              className={`flex items-center w-full text-left px-2 py-1 hover:bg-muted rounded truncate ${
                selectedPath === node.path ? "bg-accent font-medium" : ""
              }`}
              onClick={() => toggleDir(node.path)}
              title={node.path}
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              )}
              <FolderIcon className="h-4 w-4 mr-1 text-blue-500 flex-shrink-0" />
              <span className="font-medium truncate">{node.name}</span>
            </button>
            {/* Optional: Add delete for folders if needed */}
            {/* <DropdownMenu> ... </DropdownMenu> */}
          </div>
          {isExpanded && node.children && (
            <ul className="text-sm">
              {node.children.map((child) => renderNode(child, level + 1))}
            </ul>
          )}
        </li>
      )
    } else {
      // File node
      return (
        <li key={node.path} className={`py-0.5 ${level > 0 ? "ml-4" : ""}`}>
          <div className="flex items-center group">
            <button
              className={`flex items-center w-full text-left px-2 py-1 hover:bg-muted rounded truncate ${
                selectedPath === node.path ? "bg-accent font-medium" : ""
              }`}
              // Pass the required FileEntry fields from the TreeNode
              onClick={() => onSelect({ name: node.name, path: node.path })}
              title={node.path}
            >
              <FileIcon className="h-4 w-4 mr-1 text-gray-500 flex-shrink-0" />
              {node.name}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0"
                >
                  <TrashIcon className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(node.path)}
                >
                  Delete file
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </li>
      )
    }
  }

  if (isLoading && treeNodes.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <ul className="text-sm py-1">
      {treeNodes.map((node) => renderNode(node, 0))}
      {treeNodes.length === 0 && !isLoading && (
        <li className="px-2 text-muted-foreground">No files found</li>
      )}
    </ul>
  )
}
