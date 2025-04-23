"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ResizablePanelGroup, ResizablePanel } from "@/components/ui/resizable"
import { toast } from "sonner"
import type { ReaddirEntry, FSStatResult } from "@codesandbox/sdk"
import { FileExplorer } from "@/components/features/studio/publish/components/FileExplorer"
import { EditorPane } from "@/components/features/studio/publish/components/EditorPane"
import { PreviewPane } from "@/components/features/studio/publish/components/PreviewPane"
import { PublishHeader } from "@/components/features/studio/publish/components/PublishHeader"
import { Loader2Icon } from "lucide-react"
import { useSandbox } from "@/components/features/studio/publish/hooks/useSandbox"

interface FileEntry {
  path: string
  type: "file" | "dir"
  name: string
  isSymlink: boolean
}

function PublishPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [files, setFiles] = useState<FileEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<FileEntry | null>(null)
  const [code, setCode] = useState<string>("")
  const [isTreeLoading, setIsTreeLoading] = useState(false)
  const [isFileLoading, setIsFileLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const {
    sandbox,
    sandboxId,
    previewURL,
    isLoading: isSandboxLoading,
  } = useSandbox({
    defaultSandboxId: searchParams.get("sandboxId"),
  })

  console.log("sandbox")

  useEffect(() => {
    if (sandboxId && sandboxId !== searchParams.get("sandboxId")) {
      router.push(`${window.location.pathname}?sandboxId=${sandboxId}`, {
        scroll: false,
      })
    }
  }, [sandboxId, router, searchParams])

  const mapReaddirEntryToFileEntry = (
    entry: ReaddirEntry,
    parentPath: string,
  ): FileEntry => ({
    name: entry.name,
    path: `${parentPath === "/" ? "" : parentPath}/${entry.name}`,
    type: entry.type === "directory" ? "dir" : "file",
    isSymlink: entry.isSymlink,
  })

  const loadRootDirectory = async () => {
    if (!sandbox) return
    setIsTreeLoading(true)
    try {
      const entries = await sandbox.fs.readdir("/")
      setFiles(entries.map((entry) => mapReaddirEntryToFileEntry(entry, "/")))
    } catch (error) {
      console.error("Failed to load root directory:", error)
      toast.error("Failed to load project files")
      setFiles([])
    } finally {
      setIsTreeLoading(false)
    }
  }

  useEffect(() => {
    loadRootDirectory()
  }, [sandbox])

  useEffect(() => {
    if (!sandbox || !selectedEntry || selectedEntry.type !== "file") {
      setCode("")
      setIsFileLoading(false)
      return
    }

    const loadContent = async () => {
      setIsFileLoading(true)
      try {
        const content = await sandbox.fs.readTextFile(selectedEntry.path)
        setCode(content)
      } catch (error) {
        console.error("Failed to load file content:", error)
        toast.error(`Failed to load ${selectedEntry.name}`)
        setCode("")
        setSelectedEntry(null)
      } finally {
        setIsFileLoading(false)
      }
    }

    loadContent()
  }, [sandbox, selectedEntry])

  const handleCodeChange = (value: string) => {
    setCode(value)
    if (!sandbox || !selectedEntry || selectedEntry.type !== "file") return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        await sandbox.fs.writeTextFile(selectedEntry.path, value)
      } catch (error) {
        console.error("Failed to save file:", error)
        toast.error(`Failed to save ${selectedEntry.name}`)
      }
    }, 800)
  }

  const handleCreateFile = async (filePath: string) => {
    if (!sandbox) return
    const fullPath = filePath.startsWith("/") ? filePath : `/${filePath}`
    try {
      await sandbox.fs.writeTextFile(fullPath, "")
      await loadRootDirectory()
      const newEntry: FileEntry = {
        name: filePath.split("/").pop() || filePath,
        path: fullPath,
        type: "file",
        isSymlink: false,
      }
      setSelectedEntry(newEntry)
      toast.success(`Created ${filePath}`)
    } catch (error) {
      console.error("Failed to create file:", error)
      toast.error(`Failed to create ${filePath}`)
    }
  }

  const handleDeleteEntry = async (entryPath: string) => {
    if (!sandbox) return
    try {
      let isDir = false
      try {
        const statResult = await sandbox.fs.stat(entryPath)
        isDir = statResult.type === "directory"
      } catch (statError) {
        console.warn(`Stat failed for ${entryPath} during delete:`, statError)
      }

      await sandbox.fs.remove(entryPath, isDir)
      if (selectedEntry?.path === entryPath) {
        setSelectedEntry(null)
        setCode("")
      }
      await loadRootDirectory()
      toast.success(`Deleted ${entryPath.split("/").pop()}`)
    } catch (error) {
      console.error(`Failed to delete ${entryPath}:`, error)
      toast.error(`Failed to delete ${entryPath.split("/").pop()}`)
    }
  }

  const handleLoadDirectory = async (dirPath: string): Promise<FileEntry[]> => {
    if (!sandbox) throw new Error("Sandbox not available")
    try {
      const entries = await sandbox.fs.readdir(dirPath)
      return entries.map((entry) => mapReaddirEntryToFileEntry(entry, dirPath))
    } catch (error) {
      console.error(`Failed to load directory ${dirPath}:`, error)
      toast.error(`Failed to load contents of ${dirPath.split("/").pop()}`)
      return []
    }
  }

  const handleReset = () => {
    window.location.reload()
  }

  if (isSandboxLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2Icon className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">Initializing sandbox...</p>
        </div>
      </div>
    )
  }

  if (!sandbox) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-destructive">
          <p className="text-lg">Failed to initialize sandbox.</p>
          <button onClick={handleReset}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex flex-col">
      <PublishHeader sandboxId={sandboxId} onReset={handleReset} />

      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={20} minSize={15} className="border-r">
          <FileExplorer
            entries={files}
            onSelect={setSelectedEntry}
            selectedPath={selectedEntry?.path || null}
            onDelete={handleDeleteEntry}
            onCreateFile={handleCreateFile}
            onRefresh={loadRootDirectory}
            isLoading={isTreeLoading}
            fetchDirectoryContent={handleLoadDirectory}
          />
        </ResizablePanel>

        <ResizablePanel defaultSize={80} minSize={55}>
          <Tabs defaultValue="editor" className="h-full flex flex-col">
            <TabsList className="mx-2 mt-2">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview" disabled={!previewURL}>
                Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="flex-1 min-h-0 p-2">
              <EditorPane
                selectedFile={selectedEntry}
                code={code}
                onCodeChange={handleCodeChange}
                isLoading={isFileLoading}
              />
            </TabsContent>
            <TabsContent value="preview" className="flex-1 min-h-0 p-2">
              <PreviewPane previewURL={previewURL} />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default function PublishPage() {
  return (
    <Suspense fallback={<div>Loading project...</div>}>
      <PublishPageContent />
    </Suspense>
  )
}
