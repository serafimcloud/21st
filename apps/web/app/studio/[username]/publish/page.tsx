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
const API_BASE_URL = "http://localhost:8080" //"https://21st-studio.up.railway.app"

// Types
interface FileEntry {
  name: string
  isDir: boolean
  path?: string
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
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [code, setCode] = useState<string>("")
  const [newFileName, setNewFileName] = useState("")
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isFileLoading, setIsFileLoading] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
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

  // 2. Init WebSocket
  useEffect(() => {
    if (!projectId) return

    // Create WebSocket connection to the backend
    const wsUrl = `${API_BASE_URL.replace("https://", "wss://").replace("http://", "ws://")}/ws?projectId=${projectId}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => console.log("WebSocket connected")
    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      toast.error("WebSocket connection error")
    }
    ws.onclose = () => console.log("WebSocket closed")

    wsRef.current = ws

    return () => {
      ws.close()
    }
  }, [projectId])

  // 3. Load file tree
  const fetchFileTree = async () => {
    if (!projectId) return

    try {
      setIsFetching(true)
      const fileEntries = await fetchJSON(`/projects/${projectId}/files`)
      setFiles(fileEntries)
    } catch (error) {
      console.error("Failed to load files:", error)
      toast.error("Failed to load files")
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchFileTree()
    }
  }, [projectId])

  // 4. Load file content when selected
  useEffect(() => {
    if (!projectId || !selectedPath) return

    try {
      setIsFileLoading(true)
      fetch(
        `${API_BASE_URL}/projects/${projectId}/file?path=${encodeURIComponent(selectedPath)}`,
      )
        .then((res) => res.text())
        .then(setCode)
        .catch((error) => {
          console.error("Failed to load file content:", error)
          toast.error("Failed to load file content")
        })
        .finally(() => setIsFileLoading(false))
    } catch (error) {
      setIsFileLoading(false)
    }
  }, [projectId, selectedPath])

  // 5. Send code changes (debounced)
  const sendChange = (content: string) => {
    if (
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN ||
      !selectedPath
    )
      return

    wsRef.current.send(
      JSON.stringify({ type: "fileChange", path: selectedPath, content }),
    )
  }

  const handleCodeChange = (value: string) => {
    setCode(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => sendChange(value), 500)
  }

  // 6. Create new file
  const createNewFile = () => {
    if (
      !projectId ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN ||
      !newFileName
    )
      return

    const newFilePath = `/${newFileName}`

    wsRef.current.send(
      JSON.stringify({
        type: "fileCreate",
        path: newFilePath,
        content: "",
      }),
    )

    // Reset UI state
    setNewFileName("")
    setIsCreatingFile(false)
    toast.success(`Created ${newFileName}`)

    // Refresh file tree and select new file
    setTimeout(() => {
      fetchFileTree()
      setSelectedPath(newFilePath)
    }, 500)
  }

  // 7. Delete file
  const deleteFile = (fileName: string) => {
    if (
      !projectId ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    )
      return

    const filePath = `/${fileName}`

    wsRef.current.send(
      JSON.stringify({
        type: "fileDelete",
        path: filePath,
      }),
    )

    // Reset selection if the deleted file was selected
    if (selectedPath === filePath) {
      setSelectedPath(null)
      setCode("")
    }

    toast.success(`Deleted ${fileName}`)

    // Refresh file tree
    setTimeout(fetchFileTree, 500)
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
                onSelect={setSelectedPath}
                selectedPath={selectedPath}
                onDelete={deleteFile}
                isLoading={isFetching}
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
              ) : selectedPath ? (
                <CodeMirror
                  value={code}
                  height="100%"
                  extensions={[
                    selectedPath
                      ? getLanguageExtension(selectedPath)
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
                  Select a file to start editing
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
}: {
  entries: FileEntry[]
  onSelect: (path: string) => void
  selectedPath: string | null
  onDelete: (fileName: string) => void
  isLoading: boolean
}) {
  const handleFileClick = (fileName: string) => {
    onSelect(`/${fileName}`)
  }

  if (isLoading && entries.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <ul className="text-sm py-2">
      {entries.map((entry) => (
        <li key={entry.name} className="py-1">
          {entry.isDir ? (
            <details className="group">
              <summary className="flex items-center px-2 py-1 cursor-pointer hover:bg-muted rounded list-none">
                <FolderIcon className="h-4 w-4 mr-1 text-blue-500" />
                <span className="font-medium">{entry.name}</span>
              </summary>
              {/* We'd need another API call to get nested files */}
              <ul className="pl-4 mt-1">
                <li className="text-xs text-muted-foreground px-2 py-1">
                  Directory listing not implemented
                </li>
              </ul>
            </details>
          ) : (
            <div className="flex items-center group">
              <button
                className={`flex items-center w-full text-left px-2 py-1 hover:bg-muted rounded ${
                  selectedPath === `/${entry.name}`
                    ? "bg-muted font-medium"
                    : ""
                }`}
                onClick={() => handleFileClick(entry.name)}
              >
                <FileIcon className="h-4 w-4 mr-1 text-gray-500" />
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
                    onClick={() => onDelete(entry.name)}
                  >
                    Delete file
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </li>
      ))}
      {entries.length === 0 && !isLoading && (
        <li className="px-2 text-muted-foreground">No files found</li>
      )}
    </ul>
  )
}
