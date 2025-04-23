"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ResizablePanelGroup, ResizablePanel } from "@/components/ui/resizable"
import { FileExplorer } from "@/components/features/studio/publish/components/FileExplorer"
import { EditorPane } from "@/components/features/studio/publish/components/EditorPane"
import { PreviewPane } from "@/components/features/studio/publish/components/PreviewPane"
import { PublishHeader } from "@/components/features/studio/publish/components/PublishHeader"
import { Loader2Icon } from "lucide-react"
import { useSandbox } from "@/components/features/studio/publish/hooks/useSandbox"
import {
  useFileSystem,
  type FileEntry,
} from "@/components/features/studio/publish/hooks/useFileSystem"

function PublishPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedEntry, setSelectedEntry] = useState<FileEntry | null>(null)
  const [code, setCode] = useState<string>("")

  const {
    sandbox,
    sandboxId,
    previewURL,
    isLoading: isSandboxLoading,
  } = useSandbox({
    defaultSandboxId: searchParams.get("sandboxId"),
  })

  const {
    files,
    isTreeLoading,
    isFileLoading,
    loadRootDirectory,
    loadDirectory,
    loadFileContent,
    saveFileContent,
    createFile,
    deleteEntry,
  } = useFileSystem(sandbox)

  useEffect(() => {
    if (sandboxId && sandboxId !== searchParams.get("sandboxId")) {
      router.push(`${window.location.pathname}?sandboxId=${sandboxId}`, {
        scroll: false,
      })
    }
  }, [sandboxId, router, searchParams])

  useEffect(() => {
    if (!sandbox || !selectedEntry || selectedEntry.type !== "file") {
      setCode("")
      return
    }

    const loadContent = async () => {
      try {
        const content = await loadFileContent(selectedEntry.path)
        setCode(content)
      } catch (error) {
        setCode("")
        setSelectedEntry(null)
      }
    }

    loadContent()
  }, [sandbox, selectedEntry, loadFileContent])

  const handleCodeChange = (value: string) => {
    setCode(value)
    if (!sandbox || !selectedEntry || selectedEntry.type !== "file") return
    saveFileContent(selectedEntry.path, value)
  }

  const handleCreateFile = async (filePath: string) => {
    try {
      await createFile(filePath)
      await loadRootDirectory()
      const newEntry: FileEntry = {
        name: filePath.split("/").pop() || filePath,
        path: filePath.startsWith("/") ? filePath : `/${filePath}`,
        type: "file",
        isSymlink: false,
      }
      setSelectedEntry(newEntry)
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleDeleteEntry = async (entryPath: string) => {
    try {
      await deleteEntry(entryPath)
      if (selectedEntry?.path === entryPath) {
        setSelectedEntry(null)
        setCode("")
      }
      await loadRootDirectory()
    } catch (error) {
      // Error is handled in the hook
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
            fetchDirectoryContent={loadDirectory}
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
