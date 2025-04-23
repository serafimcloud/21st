"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ResizablePanelGroup, ResizablePanel } from "@/components/ui/resizable"
import { toast } from "sonner"
import { FileEntry } from "@/components/features/studio/publish/api"
import {
  initializeProject,
  fetchFileTree,
  fetchDirectoryContent,
  loadFileContent,
  saveFileContent,
  createFile,
  deleteFile,
} from "@/components/features/studio/publish/api"
import { FileExplorer } from "@/components/features/studio/publish/components/FileExplorer"
import { EditorPane } from "@/components/features/studio/publish/components/EditorPane"
import { PreviewPane } from "@/components/features/studio/publish/components/PreviewPane"
import { PublishHeader } from "@/components/features/studio/publish/components/PublishHeader"
import { Loader2Icon } from "lucide-react"

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
  const [isFetching, setIsFetching] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isFileLoading, setIsFileLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const initialize = async () => {
      setIsInitializing(true)
      try {
        const { projectId: newProjectId, previewURL: newPreviewURL } =
          await initializeProject(projectId)
        setProjectId(newProjectId)
        setPreviewURL(newPreviewURL)
        if (newProjectId !== projectId) {
          router.push(`${window.location.pathname}?projectId=${newProjectId}`, {
            scroll: false,
          })
        }
      } catch (error) {
        console.error("Failed to initialize project:", error)
        toast.error("Failed to initialize project")
      } finally {
        setIsInitializing(false)
      }
    }

    initialize()
  }, [])

  const loadFileTree = async (projectId: string) => {
    try {
      setIsFetching(true)
      const fileEntries = await fetchFileTree(projectId)
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
      loadFileTree(projectId)
    }
  }, [projectId])

  useEffect(() => {
    if (!projectId || !selectedEntry || selectedEntry.type !== "file") {
      setCode("")
      setIsFileLoading(false)
      return
    }

    const loadContent = async () => {
      try {
        setIsFileLoading(true)
        const content = await loadFileContent(projectId, selectedEntry.path)
        setCode(content)
      } catch (error) {
        console.error("Failed to load file content:", error)
        toast.error("Failed to load file content")
        setCode("")
      } finally {
        setIsFileLoading(false)
      }
    }

    loadContent()
  }, [projectId, selectedEntry])

  const handleCodeChange = (value: string) => {
    setCode(value)
    if (!selectedEntry || selectedEntry.type !== "file") return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        await saveFileContent(projectId!, selectedEntry.path, value)
      } catch (error) {
        console.error("Failed to save file:", error)
        toast.error("Failed to save file")
      }
    }, 800)
  }

  const handleCreateFile = async (fileName: string) => {
    if (!projectId) return
    try {
      await createFile(projectId, fileName)
      await loadFileTree(projectId)
      const newFile = files.find((f) => f.path === `/${fileName}`)
      if (newFile) setSelectedEntry(newFile)
      toast.success(`Created ${fileName}`)
    } catch (error) {
      console.error("Failed to create file:", error)
      toast.error("Failed to create file")
    }
  }

  const handleDeleteFile = async (filePath: string) => {
    if (!projectId) return
    try {
      await deleteFile(projectId, filePath)
      if (selectedEntry?.path === filePath) {
        setSelectedEntry(null)
        setCode("")
      }
      await loadFileTree(projectId)
      toast.success(`Deleted ${filePath.split("/").pop()}`)
    } catch (error) {
      console.error("Failed to delete file:", error)
      toast.error("Failed to delete file")
    }
  }

  const handleReset = () => {
    window.location.reload()
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
      <PublishHeader projectId={projectId} onReset={handleReset} />

      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={20} minSize={15} className="border-r">
          <FileExplorer
            entries={files}
            onSelect={setSelectedEntry}
            selectedPath={selectedEntry?.path || null}
            onDelete={handleDeleteFile}
            onCreateFile={handleCreateFile}
            onRefresh={() => projectId && loadFileTree(projectId)}
            isLoading={isFetching}
            fetchDirectoryContent={(dirPath) =>
              fetchDirectoryContent(projectId!, dirPath)
            }
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
