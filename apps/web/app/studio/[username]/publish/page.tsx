"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Sandpack } from "@codesandbox/sandpack-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ResizablePanelGroup, ResizablePanel } from "@/components/ui/resizable"
import CodeMirror from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { html } from "@codemirror/lang-html"
import { css } from "@codemirror/lang-css"
import { json } from "@codemirror/lang-json"
import { oneDark } from "@codemirror/theme-one-dark"
import { Input } from "@/components/ui/input"
import {
  PlusIcon,
  FolderIcon,
  FileIcon,
  RefreshCwIcon,
  TrashIcon,
  Loader2Icon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

// Backend API URL
const API_BASE_URL = "http://localhost:8080" //

// Types
interface FileEntry {
  name: string
  type: "file" | "dir"
  path: string
  children?: FileEntry[]
}

// Utility
const fetchJSON = async (url: string, opts: RequestInit = {}) => {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`
  const res = await fetch(fullUrl, opts)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2)
}

const getLanguageExtension = (filename: string) => {
  const ext = getFileExtension(filename).toLowerCase()

  switch (ext) {
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
      return javascript()
    case "html":
    case "htm":
    case "svg":
    case "xml":
      return html()
    case "css":
    case "scss":
    case "sass":
    case "less":
      return css()
    case "json":
      return json()
    default:
      return javascript()
  }
}

// Main Component Content
function PublishPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(
    searchParams.get("projectId"),
  )
  const [previewURL, setPreviewURL] = useState<string | null>(null)
  const [files, setFiles] = useState<FileEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<FileEntry | null>(null)
  const [code, setCode] = useState<string>("")
  const [newFileName, setNewFileName] = useState("")
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isFileLoading, setIsFileLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // 1. Bootstrap sandbox or load existing one
  useEffect(() => {
    const initializeSandbox = async () => {
      setIsInitializing(true)
      const existingProjectId = searchParams.get("projectId")

      if (existingProjectId) {
        try {
          // Attempt to load existing project details
          const { previewURL } = await fetchJSON(
            `/projects/${existingProjectId}`,
          )
          setProjectId(existingProjectId)
          setPreviewURL(previewURL)
          toast.info(`Restored sandbox: ${existingProjectId}`)
        } catch (error) {
          console.error("Failed to load existing sandbox:", error)
          toast.warning("Failed to load existing sandbox, creating a new one.")
          // If loading fails, create a new project
          await createNewSandbox()
        }
      } else {
        // Create a new project if no projectId in URL
        await createNewSandbox()
      }
      setIsInitializing(false)
    }

    const createNewSandbox = async () => {
      try {
        const { projectId: newProjectId, previewURL: newPreviewURL } =
          await fetchJSON("/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ template: "nextjs-builder" }),
          })
        setProjectId(newProjectId)
        setPreviewURL(newPreviewURL)
        // Update URL with the new projectId
        router.push(
          `${window.location.pathname}?projectId=${newProjectId}`,
          { scroll: false }, // Use Next.js router for client-side navigation
        )
        toast.success("New sandbox created successfully")
      } catch (error) {
        console.error("Failed to create sandbox:", error)
        toast.error("Failed to create sandbox")
        // Potentially add retry logic or guide user
      }
    }

    initializeSandbox()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run only once on mount

  // 3. Load file tree
  const fetchFileTree = async () => {
    if (!projectId) return

    try {
      setIsFetching(true)
      const fileEntries = await fetchJSON(`/projects/${projectId}/files`)

      // Map the API response to our FileEntry interface
      const mappedEntries = fileEntries.map((entry: any) => ({
        name: entry.name,
        type: entry.type,
        // Remove "/home/user" prefix from paths
        path: entry.path.replace(/^\/home\/user/, ""),
      }))

      setFiles(mappedEntries)
    } catch (error) {
      console.error("Failed to load files:", error)
      toast.error("Failed to load files")
    } finally {
      setIsFetching(false)
    }
  }

  // Fetch directory content
  const fetchDirectoryContent = async (
    dirPath: string,
  ): Promise<FileEntry[]> => {
    if (!projectId) return []
    try {
      const dirEntries = await fetchJSON(
        `/projects/${projectId}/dir?path=${encodeURIComponent(dirPath)}`,
      )
      // Map the API response to our FileEntry interface
      return dirEntries.map((entry: any) => ({
        name: entry.name,
        type: entry.type,
        // Remove "/home/user" prefix from paths
        path: entry.path.replace(/^\/home\/user/, ""),
      }))
    } catch (error) {
      console.error(`Failed to load directory content for ${dirPath}:`, error)
      toast.error(`Failed to load directory content for ${dirPath}`)
      return [] // Return empty array on error
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchFileTree()
    }
  }, [projectId])

  // 4. Load content based on selection
  useEffect(() => {
    // Clear editor if nothing is selected
    if (!projectId || !selectedEntry) {
      setCode("")
      setIsFileLoading(false)
      return
    }

    // Load content only if it's a file
    if (selectedEntry.type === "file") {
      loadFileContent(selectedEntry.path)
    } else {
      // Directory selected, clear editor
      setCode("")
      setIsFileLoading(false)
    }
    // Depend only on projectId and the selected entry object
  }, [projectId, selectedEntry])

  const loadFileContent = (filePath: string) => {
    if (!projectId) return // Added check

    // Ensure path is properly formatted without /home/user prefix
    const cleanPath = filePath.replace(/^\/home\/user/, "")

    try {
      setIsFileLoading(true)
      fetch(
        `${API_BASE_URL}/projects/${projectId}/file?path=${encodeURIComponent(cleanPath)}`,
      )
        .then((res) => res.text())
        .then(setCode)
        .catch((error) => {
          console.error(`Failed to load file content for ${cleanPath}:`, error)
          toast.error("Failed to load file content")
          setCode("") // Clear code on error
        })
        .finally(() => setIsFileLoading(false))
    } catch (error) {
      console.error("Error in loadFileContent:", error) // Log sync errors too
      toast.error("Error initiating file load")
      setCode("")
      setIsFileLoading(false)
    }
  }

  // 5. Send code changes (debounced)
  const saveFileContent = async (filePath: string, content: string) => {
    if (!projectId || !filePath) return

    try {
      const cleanPath = filePath.replace(/^\/home\/user/, "")
      await fetchJSON(
        `/projects/${projectId}/file?path=${encodeURIComponent(cleanPath)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        },
      )
    } catch (error) {
      console.error(`Failed to save file ${filePath}:`, error)
      toast.error("Failed to save file changes")
    }
  }

  const handleCodeChange = (value: string) => {
    setCode(value)
    if (!selectedEntry || selectedEntry.type !== "file") return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(
      () => saveFileContent(selectedEntry.path, value),
      500,
    )
  }

  // 6. Create new file
  const createNewFile = async () => {
    if (!projectId || !newFileName) return

    // Make sure the path is properly formatted
    const newFilePath = newFileName.startsWith("/")
      ? newFileName
      : `/${newFileName}`

    try {
      await fetchJSON(
        `/projects/${projectId}/file?path=${encodeURIComponent(newFilePath)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "" }),
        },
      )

      setNewFileName("")
      setIsCreatingFile(false)
      toast.success(`Created ${newFileName}`)

      // Refresh file tree and select the new file
      await fetchFileTree()
      const newlyCreatedEntry = files.find((f) => f.path === newFilePath)
      setSelectedEntry(newlyCreatedEntry || null)
    } catch (error) {
      console.error(`Failed to create file ${newFilePath}:`, error)
      toast.error("Failed to create file")
    }
  }

  // 7. Delete file
  const deleteFile = async (filePath: string) => {
    if (!projectId) return

    // Ensure the path is properly formatted (without /home/user prefix)
    const cleanPath = filePath.replace(/^\/home\/user/, "")

    try {
      await fetchJSON(
        `/projects/${projectId}/file?path=${encodeURIComponent(cleanPath)}`,
        {
          method: "DELETE",
        },
      )

      // Reset selection if the deleted file was selected
      if (selectedEntry?.path === filePath) {
        setSelectedEntry(null)
        setCode("")
      }

      toast.success(`Deleted ${filePath.split("/").pop() || filePath}`) // Show just filename in toast
      fetchFileTree() // Refresh file tree immediately
    } catch (error) {
      console.error(`Failed to delete file ${cleanPath}:`, error)
      toast.error("Failed to delete file")
    }
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
          onClick={() => window.location.reload()}
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
                  onClick={() => setIsCreatingFile(true)}
                  disabled={isFetching}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={fetchFileTree}
                  disabled={isFetching}
                >
                  {isFetching ? (
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
                      if (e.key === "Enter") createNewFile()
                      if (e.key === "Escape") {
                        setIsCreatingFile(false)
                        setNewFileName("")
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={createNewFile}
                    disabled={!newFileName}
                  >
                    Create
                  </Button>
                </div>
              </div>
            )}

            <CardContent className="p-0 overflow-y-auto flex-1">
              <FileTree
                entries={files}
                onSelect={setSelectedEntry}
                selectedPath={selectedEntry?.path || null}
                onDelete={deleteFile}
                isLoading={isFetching}
                fetchDirectoryContent={fetchDirectoryContent}
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
              ) : selectedEntry && selectedEntry.type === "file" ? (
                <CodeMirror
                  value={code}
                  height="100%"
                  extensions={[
                    selectedEntry
                      ? getLanguageExtension(selectedEntry.path)
                      : javascript(),
                  ]}
                  theme={oneDark}
                  onChange={handleCodeChange}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    autocompletion: true,
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  {selectedEntry && selectedEntry.type === "dir"
                    ? `Directory: ${selectedEntry.path || selectedEntry.name}`
                    : "Select a file to start editing"}
                </div>
              )}
            </TabsContent>
            <TabsContent value="preview" className="flex-1 min-h-0 p-2">
              {previewURL ? (
                <iframe
                  src={previewURL}
                  className="w-full h-full border rounded"
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

// FileTree Component
function FileTree({
  entries,
  onSelect,
  selectedPath,
  onDelete,
  isLoading,
  fetchDirectoryContent,
}: {
  entries: FileEntry[]
  onSelect: (entry: FileEntry) => void
  selectedPath: string | null
  onDelete: (filePath: string) => void
  isLoading: boolean
  fetchDirectoryContent: (dirPath: string) => Promise<FileEntry[]>
}) {
  const [expandedDirs, setExpandedDirs] = useState<Record<string, FileEntry[]>>(
    {},
  )
  const [loadingDirs, setLoadingDirs] = useState<Record<string, boolean>>({})

  // Call onSelect with the full entry when a file is clicked
  const handleFileClick = (entry: FileEntry) => {
    onSelect(entry)
  }

  // Directory clicks load content but don't trigger onSelect for the editor pane
  const handleDirClick = async (entry: FileEntry, e: React.MouseEvent) => {
    if (!expandedDirs[entry.path] || e.ctrlKey) {
      try {
        setLoadingDirs((prev) => ({ ...prev, [entry.path]: true }))
        const dirContents = await fetchDirectoryContent(entry.path) // Use prop
        setExpandedDirs((prev) => ({ ...prev, [entry.path]: dirContents }))
      } catch (error) {
        // Error is already handled and toasted in the passed function
        // console.error(`Failed to load contents of ${entry.path}:`, error) // Optional: log again here if needed
        toast.error(`UI Error: Could not display contents for ${entry.name}`) // Add UI specific error toast
      } finally {
        setLoadingDirs((prev) => ({ ...prev, [entry.path]: false }))
      }
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
    // Added currentLevel for potential indentation styling if needed later
    <ul className={`text-sm py-1 ${currentLevel > 0 ? "pl-4" : ""}`}>
      {items.map((entry) => (
        <li key={entry.path} className="py-0.5">
          {entry.type === "dir" ? (
            <details className="group" open={!!expandedDirs[entry.path]}>
              {" "}
              {/* Keep details open if loaded */}
              <summary
                className={`flex items-center px-2 py-1 cursor-pointer hover:bg-muted rounded list-none ${
                  selectedPath === entry.path ? "bg-accent" : "" // Highlight selected dir summary
                }`}
                onClick={(e) => {
                  e.preventDefault() // Prevent default details toggle if needed, handle via state?
                  handleDirClick(entry, e)
                  // Optionally select the directory itself for context, if desired:
                  // onSelect(entry)
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
              {/* Render contents only if loaded */}
              {expandedDirs[entry.path] && (
                <div className="mt-1">
                  {(() => {
                    const content = expandedDirs[entry.path] // Assign to variable
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
                  selectedPath === entry.path
                    ? "bg-accent font-medium" // Use accent for selection
                    : ""
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
      {/* Don't show "No files found" for subdirectories if they are just empty */}
      {items.length === 0 && currentLevel === 0 && !isLoading && (
        <li className="px-2 text-muted-foreground">No files found</li>
      )}
    </ul>
  )

  return renderEntries(entries)
}
