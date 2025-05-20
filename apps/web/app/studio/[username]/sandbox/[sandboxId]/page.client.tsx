"use client"

import { useEffect, useState, Suspense } from "react"
import { useParams, useRouter, usePathname } from "next/navigation"
import {
  ResizableHandle,
  ResizablePanelGroup,
  ResizablePanel,
} from "@/components/ui/resizable"
import { FileExplorer } from "@/components/features/studio/sandbox/components/file-explorer"
import { PreviewPane } from "@/components/features/studio/sandbox/components/preview-pane"
import {
  ServerSandbox,
  useSandbox,
} from "@/components/features/studio/sandbox/hooks/use-sandbox"
import {
  useFileSystem,
  type FileEntry,
} from "@/components/features/studio/sandbox/hooks/use-file-system"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import {
  XCircle,
  RefreshCw,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/ui/theme-toggle"

function PublishClientPageContent({
  setServerSandbox,
}: {
  setServerSandbox: (serverSandbox: ServerSandbox) => void
}) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const sandboxId = params.sandboxId as string
  const username = params.username as string
  const [selectedEntry, setSelectedEntry] = useState<FileEntry | null>(null)
  const [code, setCode] = useState<string>("")
  const [showPreview, setShowPreview] = useState<boolean>(true)
  const [iframeKey, setIframeKey] = useState<number>(0)
  const [isNavigating, setIsNavigating] = useState(false)

  const {
    sandboxRef,
    previewURL,
    isSandboxLoading,
    sandboxConnectionHash,
    reconnectSandbox,
    missingDependencyInfo,
    clearMissingDependencyInfo,
    connectedShellId,
    serverSandbox,
  } = useSandbox({ sandboxId })

  console.log("previewURL", previewURL)

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
    generateRegistry,
    addFrom21Registry,
  } = useFileSystem({
    sandboxRef,
    reconnectSandbox,
    sandboxConnectionHash,
  })

  const handleAddFrom21Registry = async (jsonUrl: string) => {
    try {
      await addFrom21Registry(jsonUrl)
      await loadRootDirectory()
      toast.success("Added from 21st.dev registry")
    } catch (error) {
      toast.error("Failed to add from 21st.dev registry")
      console.error(error)
    }
  }

  useEffect(() => {
    // Renamed function for clarity
    const findAndSelectFirstUiFile = async () => {
      console.log("Attempting to find initial UI file...") // Log: Start
      console.log(
        "isTreeLoading:",
        isTreeLoading,
        "files.length:",
        files.length,
        "selectedEntry:",
        selectedEntry,
      ) // Log: State check
      if (!isTreeLoading && files.length > 0 && !selectedEntry) {
        console.log("Files list:", JSON.stringify(files, null, 2)) // Log: Full file list (can be verbose)

        const findFirstUiFile = (entries: FileEntry[]): FileEntry | null => {
          for (const entry of entries) {
            // Check if path starts with /src/components/ui AND is not a directory itself
            if (entry.path.startsWith("/src/components/ui")) {
              if (entry.type === "file") {
                console.log("Found potential UI file:", entry.path) // Log: Potential find
                return entry
              } else if (entry.type === "dir" && entry.children) {
                // Recurse only if it's a directory within the target path
                const fileInChildren = findFirstUiFile(entry.children)
                if (fileInChildren) return fileInChildren
              }
            }
            // Also check children even if parent doesn't match, path might be nested deeper
            else if (entry.type === "dir" && entry.children) {
              const fileInChildren = findFirstUiFile(entry.children)
              if (fileInChildren) return fileInChildren
            }
          }
          return null
        }

        const firstUiFile = findFirstUiFile(files)
        console.log("Result of findFirstUiFile:", firstUiFile) // Log: Result

        if (firstUiFile) {
          console.log("Setting selected entry:", firstUiFile.path) // Log: Setting state
          setSelectedEntry(firstUiFile)
          // Explicitly load content after setting the entry
          try {
            console.log("Calling loadFileContent for:", firstUiFile.path) // Log: Loading content
            const content = await loadFileContent(firstUiFile.path)
            console.log("Content loaded successfully.") // Log: Load success
            setCode(content)
          } catch (error) {
            // Handle error if initial load fails
            console.error("Failed to load initial file content:", error) // Log: Load error
            setCode("")
            setSelectedEntry(null)
          }
        } else {
          console.log("No initial UI file found in /src/components/ui") // Log: Not found
        }
      }
    }

    findAndSelectFirstUiFile()
  }, [files, isTreeLoading, selectedEntry, loadFileContent]) // Add loadFileContent to dependencies

  useEffect(() => {
    if (serverSandbox) {
      console.log("serverSandbox !!!!!!", serverSandbox)
      setServerSandbox(serverSandbox)
    }
  }, [serverSandbox])

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

  const handleRefreshPreview = () => {
    setIframeKey((prev) => prev + 1)
  }

  const handleTogglePreview = () => {
    setShowPreview((prev) => !prev)
  }

  if (isSandboxLoading) {
    // Skeleton Loader for Sandbox UI (3-panel layout, no header skeleton)
    return (
      <div className="h-[calc(100vh-56px)] w-full flex flex-col bg-background">
        {" "}
        {/* Added top padding for header */}
        {/* Skeleton Resizable Panel Group - Represents the main content area below the header */}
        <div className="flex flex-1 min-h-0">
          {/* Skeleton File Explorer Panel (Left) */}
          <div className="w-[20%] p-2 space-y-2 overflow-hidden">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-full" />
            <div className="pl-4 space-y-2">
              <Skeleton className="h-6 w-5/6" />
              <Skeleton className="h-6 w-1/2" />
            </div>
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-6 w-full" />
          </div>

          {/* Skeleton Resizable Handle 1 */}
          <div className="w-[1px] bg-border cursor-col-resize flex-shrink-0"></div>

          {/* Skeleton Editor Panel (Middle) */}
          <div className="w-[40%] flex flex-col overflow-hidden">
            {/* Skeleton Editor Content */}
            <div className="flex-1 p-4 space-y-2 overflow-y-auto">
              {[...Array(15)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-4 w-full"
                  style={{ width: `${Math.random() * 30 + 70}%` }}
                />
              ))}
            </div>
          </div>

          {/* Skeleton Resizable Handle 2 */}
          <div className="w-[1px] bg-border cursor-col-resize flex-shrink-0"></div>

          {/* Skeleton Preview Panel (Right) */}
          <div className="w-[40%] bg-muted/30 flex flex-col justify-center p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-8 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>

            <div className="flex gap-4 mb-6">
              <Skeleton className="h-24 w-24 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-5/6" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <Skeleton className="h-28 w-full rounded-md" />
              <Skeleton className="h-28 w-full rounded-md" />
            </div>

            <div className="flex justify-end gap-3">
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
        </div>
        {/* Skeleton Bottom Right Controls */}
        <div className="fixed bottom-4 right-4 flex gap-2 z-10">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
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
            <Button
              onClick={() => router.push(`/studio/${username}`)}
              variant="outline"
            >
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
    <div className="h-[calc(100vh-56px)] w-full flex flex-col">
      {/* Header is rendered in page.tsx */}

      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={20} minSize={15}>
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
            onAddFrom21Registry={handleAddFrom21Registry}
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
            showPreview={showPreview}
            iframeKey={iframeKey}
            onRefresh={handleRefreshPreview}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Bottom right preview controls */}
      <div className="fixed top-[65px] right-4 flex gap-2 z-10">
        <Button
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm shadow-sm border w-10"
        >
          <ThemeToggle fillIcon={false} />
        </Button>
        {showPreview && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshPreview}
            title="Reload preview"
            className="bg-background/80 backdrop-blur-sm shadow-sm border"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleTogglePreview}
          title={showPreview ? "Hide Preview" : "Show Preview"}
          className={cn(
            "bg-background/80 backdrop-blur-sm shadow-sm border transition-colors",
            !showPreview && "border-primary text-primary",
          )}
        >
          {showPreview ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

export default function PublishPage({
  setServerSandbox,
}: {
  setServerSandbox: (serverSandbox: ServerSandbox) => void
}) {
  return (
    <Suspense fallback={<div>Loading project...</div>}>
      <PublishClientPageContent setServerSandbox={setServerSandbox} />
    </Suspense>
  )
}
