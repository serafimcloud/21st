"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter, useParams } from "next/navigation"
import {
  ResizableHandle,
  ResizablePanelGroup,
  ResizablePanel,
} from "@/components/ui/resizable"
import { FileExplorer } from "@/components/features/studio/publish/components/FileExplorer"
import { PreviewPane } from "@/components/features/studio/publish/components/PreviewPane"
import { PublishHeader } from "@/components/features/studio/publish/components/PublishHeader"
import { Loader2Icon } from "lucide-react"
import { useSandbox } from "@/components/features/studio/publish/hooks/useSandbox"
import {
  useFileSystem,
  type FileEntry,
} from "@/components/features/studio/publish/hooks/useFileSystem"
import { publishSandbox } from "@/components/features/studio/publish/api"

const DEFAULT_FILE_ENTRY: FileEntry = {
  name: "component.tsx",
  path: "/src/components/ui/component.tsx",
  type: "file",
  isSymlink: false,
}

function PublishPageContent() {
  const params = useParams()
  const sandboxId = params.sandboxId as string
  const [selectedEntry, setSelectedEntry] = useState<FileEntry | null>(
    DEFAULT_FILE_ENTRY,
  )
  const [code, setCode] = useState<string>("")

  const {
    sandboxRef,
    previewURL,
    serverSandbox,
    isSandboxLoading,
    sandboxConnectionHash,
    reconnectSandbox,
    missingDependencyInfo,
    clearMissingDependencyInfo,
    connectedShellId,
  } = useSandbox({
    sandboxId,
  })

  const {
    files,
    isTreeLoading,
    isFileLoading,
    advancedView,
    toggleAdvancedView,
    loadRootDirectory,
    loadFileContent,
    saveFileContent,
    createFile,
    deleteEntry,
    createDirectory,
    renameEntry,
    addDependencyToPackageJson,
  } = useFileSystem({
    sandboxRef,
    reconnectSandbox,
    sandboxConnectionHash,
  })

  useEffect(() => {
    if (missingDependencyInfo) {
      addDependencyToPackageJson(
        missingDependencyInfo.packageName,
        missingDependencyInfo.latestVersion,
      )
      clearMissingDependencyInfo()
    }
  }, [missingDependencyInfo])

  useEffect(() => {
    if (
      !sandboxRef.current ||
      !selectedEntry ||
      selectedEntry.type !== "file"
    ) {
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
  }, [sandboxRef, selectedEntry, isSandboxLoading])

  const handleCodeChange = (value: string) => {
    setCode(value)
    if (!sandboxRef.current || !selectedEntry || selectedEntry.type !== "file")
      return
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

  const handleRenameEntry = async (oldPath: string, newName: string) => {
    try {
      const newPath = await renameEntry(oldPath, newName)

      // Update selected entry if it was the renamed one
      if (selectedEntry?.path === oldPath) {
        setSelectedEntry({
          ...selectedEntry,
          path: newPath,
          name: newName,
        })
      }

      return newPath
    } catch (error) {
      // Error is handled in the hook
      return oldPath
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

  if (!sandboxRef.current) {
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
      <PublishHeader sandboxId={sandboxId} sandboxName={serverSandbox?.name} />

      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={20} minSize={15} className="border-r">
          <FileExplorer
            entries={files}
            onSelect={setSelectedEntry}
            selectedPath={selectedEntry?.path || null}
            onDelete={handleDeleteEntry}
            onCreateFile={handleCreateFile}
            onCreateDirectory={createDirectory}
            onRename={handleRenameEntry}
            onRefresh={loadRootDirectory}
            isLoading={isTreeLoading}
            advancedView={advancedView}
            onToggleAdvancedView={toggleAdvancedView}
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={80} minSize={20}>
          <PreviewPane
            connectedShellId={connectedShellId}
            previewURL={previewURL}
            selectedFile={selectedEntry}
            code={code}
            onCodeChange={handleCodeChange}
            isFileLoading={isFileLoading}
          />
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
