import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

interface FileEntry {
  name: string
  path: string
}

const API_BASE_URL = "http://localhost:8080"

const fetchJSON = async (url: string, opts: RequestInit = {}) => {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`
  const res = await fetch(fullUrl, opts)
  if (!res.ok) {
    const errorText = await res.text()
    console.error(`API Error (${res.status}): ${errorText} for URL: ${fullUrl}`)
    throw new Error(errorText || `HTTP error! status: ${res.status}`)
  }
  const contentType = res.headers.get("content-type")
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return res.json()
  }
  return null
}

/**
 * Manages the state and backend interactions for the sandbox environment.
 * Handles project creation/loading, file operations (CRUD), and editor state.
 */
export function useSandbox() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [projectId, setProjectId] = useState<string | null>(null)
  const [previewURL, setPreviewURL] = useState<string | null>(null)
  const [files, setFiles] = useState<FileEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<FileEntry | null>(null)
  const [code, setCode] = useState<string>("")
  const [isInitializing, setIsInitializing] = useState(true)
  const [isFetchingTree, setIsFetchingTree] = useState(false)
  const [isFileLoading, setIsFileLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // --- Initialization ---
  // Fetches or creates a sandbox project based on the URL query parameter.
  useEffect(() => {
    const initializeSandbox = async () => {
      setIsInitializing(true)
      const existingProjectId = searchParams.get("projectId")

      const createNewSandbox = async () => {
        try {
          console.log("Attempting to create a new sandbox...")
          const { projectId: newProjectId, previewURL: newPreviewURL } =
            await fetchJSON("/projects", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ template: "nextjs-builder" }),
            })
          console.log("New sandbox created:", newProjectId)
          setProjectId(newProjectId)
          setPreviewURL(newPreviewURL)
          router.push(`${window.location.pathname}?projectId=${newProjectId}`, {
            scroll: false,
          })
          toast.success("New sandbox created")
        } catch (error) {
          console.error("Failed to create sandbox:", error)
          toast.error(`Failed to create sandbox: ${error}`)
        }
      }

      if (existingProjectId) {
        try {
          console.log("Attempting to load existing sandbox:", existingProjectId)
          const { previewURL: loadedPreviewURL } = await fetchJSON(
            `/projects/${existingProjectId}`,
          )
          console.log("Existing sandbox loaded:", existingProjectId)
          setProjectId(existingProjectId)
          setPreviewURL(loadedPreviewURL)
          toast.info(`Restored sandbox: ${existingProjectId}`)
        } catch (error) {
          console.warn(
            `Failed to load sandbox ${existingProjectId}:`,
            error,
            "Creating a new one.",
          )
          toast.warning(
            `Failed to load sandbox ${existingProjectId}. Creating a new one.`,
          )
          await createNewSandbox()
        }
      } else {
        console.log("No existing project ID found, creating new sandbox.")
        await createNewSandbox()
      }
      setIsInitializing(false)
    }

    initializeSandbox()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- File Tree Operations ---
  const fetchFileTree = useCallback(async () => {
    if (!projectId || isFetchingTree) return

    console.log(`Fetching file tree for project: ${projectId}`)
    setIsFetchingTree(true)
    try {
      const filePaths: string[] = await fetchJSON(
        `/projects/${projectId}/files`,
      )

      const mappedEntries: FileEntry[] = filePaths
        .map((path) => {
          const cleanPath = path.replace(/^\//, "")
          const segments = cleanPath.split("/").filter(Boolean)
          const name = segments[segments.length - 1] || cleanPath
          return {
            name: name,
            path: cleanPath,
          }
        })
        .sort((a, b) => a.path.localeCompare(b.path))

      setFiles(mappedEntries)
      console.log("File tree fetched successfully.")
    } catch (error) {
      console.error("Failed to load file tree:", error)
      toast.error(`Failed to load file tree: ${error}`)
      setFiles([])
    } finally {
      setIsFetchingTree(false)
    }
  }, [projectId])

  // Fetches the initial file tree once the project ID is available.
  useEffect(() => {
    if (projectId && !isInitializing) {
      fetchFileTree()
    }
  }, [projectId, isInitializing, fetchFileTree])

  // --- File Content Operations ---
  const loadFileContent = useCallback(
    async (entry: FileEntry) => {
      const isFile = entry.path.includes(".") || !entry.path.endsWith("/")
      if (!projectId || !isFile) {
        setCode("")
        setIsFileLoading(false)
        return
      }

      const cleanPath = entry.path.replace(/^\//, "")
      console.log(`Loading file content: ${cleanPath}`)
      setIsFileLoading(true)
      try {
        const response = await fetch(
          `${API_BASE_URL}/projects/${projectId}/file?path=${encodeURIComponent(cleanPath)}`,
        )
        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status}, ${await response.text()}`,
          )
        }
        const textContent = await response.text()
        setCode(textContent)
        console.log(`File content loaded: ${cleanPath}`)
      } catch (error) {
        console.error(`Failed to load file content for ${cleanPath}:`, error)
        toast.error(`Failed to load file: ${entry.name}`)
        setCode("")
      } finally {
        setIsFileLoading(false)
      }
    },
    [projectId],
  )

  // Loads file content when a file entry is selected.
  useEffect(() => {
    if (selectedEntry) {
      const isFile =
        selectedEntry.path.includes(".") || !selectedEntry.path.endsWith("/")
      if (isFile) {
        loadFileContent(selectedEntry)
      } else {
        setCode("")
        setIsFileLoading(false)
      }
    } else {
      setCode("")
      setIsFileLoading(false)
    }
  }, [selectedEntry, loadFileContent])

  // Saves file content changes to the backend.
  const saveFileContent = useCallback(
    async (filePath: string, content: string) => {
      if (!projectId || !filePath) return
      const cleanPath = filePath.replace(/^\//, "")
      console.log(`Saving file content: ${cleanPath}`)
      try {
        await fetchJSON(
          `/projects/${projectId}/file?path=${encodeURIComponent(cleanPath)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          },
        )
        console.log(`File content saved: ${cleanPath}`)
      } catch (error) {
        console.error(`Failed to save file ${cleanPath}:`, error)
        toast.error(`Failed to save changes to ${filePath.split("/").pop()}`)
      }
    },
    [projectId],
  )

  // Debounces the save operation when the editor code changes.
  const handleCodeChange = useCallback(
    (value: string) => {
      setCode(value)
      if (!selectedEntry) return
      const isFile =
        selectedEntry.path.includes(".") || !selectedEntry.path.endsWith("/")
      if (!isFile) return

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        saveFileContent(selectedEntry.path, value)
      }, 800)
    },
    [selectedEntry, saveFileContent],
  )

  // --- File Manipulation ---
  const createNewFile = useCallback(
    async (newFilePath: string) => {
      if (!projectId || !newFilePath) return false
      const cleanPath = newFilePath.replace(/^\//, "")

      console.log(`Creating new file: ${cleanPath}`)
      try {
        await fetchJSON(
          `/projects/${projectId}/file?path=${encodeURIComponent(cleanPath)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: "" }),
          },
        )
        toast.success(`Created ${newFilePath.split("/").pop()}`)
        await fetchFileTree()
        console.log(`File created: ${cleanPath}`)
        return cleanPath
      } catch (error) {
        console.error(`Failed to create file ${cleanPath}:`, error)
        toast.error(`Failed to create file: ${newFilePath.split("/").pop()}`)
        return false
      }
    },
    [projectId, fetchFileTree],
  )

  const deleteFile = useCallback(
    async (filePath: string) => {
      if (!projectId) return
      const cleanPath = filePath.replace(/^\//, "")
      console.log(`Deleting file: ${cleanPath}`)
      try {
        await fetchJSON(
          `/projects/${projectId}/file?path=${encodeURIComponent(cleanPath)}`,
          { method: "DELETE" },
        )

        toast.success(`Deleted ${filePath.split("/").pop()}`)

        if (selectedEntry?.path === filePath) {
          setSelectedEntry(null)
        }

        await fetchFileTree()
        console.log(`File deleted: ${cleanPath}`)
      } catch (error) {
        console.error(`Failed to delete file ${cleanPath}:`, error)
        toast.error(`Failed to delete file: ${filePath.split("/").pop()}`)
      }
    },
    [projectId, selectedEntry, fetchFileTree],
  )

  return {
    projectId,
    previewURL,
    files,
    selectedEntry,
    code,
    isInitializing,
    isFetchingTree,
    isFileLoading,
    setSelectedEntry,
    handleCodeChange,
    createNewFile,
    deleteFile,
    refreshFileTree: fetchFileTree,
  }
}

export type UseSandboxReturn = ReturnType<typeof useSandbox>
