"use client"

import { useEffect, useState, Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ResizableHandle,
  ResizablePanelGroup,
  ResizablePanel,
} from "@/components/ui/resizable"
import { FileExplorer } from "@/components/features/studio/sandbox/components/FileExplorer"
import { PreviewPane } from "@/components/features/studio/sandbox/components/PreviewPane"
import { PublishHeader } from "@/components/features/studio/sandbox/components/PublishHeader"
import { Spinner } from "@/components/icons/spinner"
import { useSandbox } from "@/components/features/studio/sandbox/hooks/use-sandbox"
import {
  useFileSystem,
  type FileEntry,
} from "@/components/features/studio/sandbox/hooks/use-file-system"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { XCircle } from "lucide-react"

const DEFAULT_FILE_ENTRY: FileEntry = {
  name: "component.tsx",
  path: "/src/components/ui/component.tsx",
  type: "file",
  isSymlink: false,
}

function PublishPageContent() {
  const params = useParams()
  const router = useRouter()
  const sandboxId = params.sandboxId as string
  const [selectedEntry, setSelectedEntry] = useState<FileEntry | null>(
    DEFAULT_FILE_ENTRY,
  )
  const [code, setCode] = useState<string>("")
  const [isRegenerating, setIsRegenerating] = useState(false)

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
    isCompiling,
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
    generateRegistry,
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

  const handleGenerateRegistry = async () => {
    console.log("Starting registry generation...")
    // setIsRegenerating(true)
    generateRegistry()
  }

  const handleReset = () => {
    window.location.reload()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sandboxRef.current) {
        if (e.key === "Escape") {
          router.back()
        } else if (e.key === "Enter") {
          handleReset()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router, sandboxRef])

  if (isSandboxLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner color="hsl(var(--foreground))" />
          <p className="text-muted-foreground">Initializing sandbox</p>
        </div>
      </div>
    )
  }

  if (!sandboxRef.current) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <XCircle className="h-6 w-6 text-muted-foreground" />
          <p className="text-base">Failed to initialize sandbox</p>
          <div className="flex gap-3">
            <Button onClick={() => router.back()} variant="outline">
              Go Back
              <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-kbd leading-none opacity-100">
                ESC
              </kbd>
            </Button>
            <Button onClick={handleReset}>
              Try Again
              <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-kbd leading-none opacity-100">
                <Icons.enter className="h-2.5 w-2.5" />
              </kbd>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex flex-col">
      <PublishHeader
        onGenerateRegistry={handleGenerateRegistry}
        isRegenerating={isRegenerating || isCompiling}
        sandboxId={sandboxId}
        sandboxName={serverSandbox?.name}
      />

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
