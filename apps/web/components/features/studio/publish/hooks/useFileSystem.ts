import { SandboxSession, ReaddirEntry } from "@codesandbox/sdk"
import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"

const ROOT_PATH = "/project/sandbox"
const EXCLUDED_NAMES = [
  "node_modules",
  "dist",
  "yarn.lock",
  "vite-env.d.ts",
  "public",
  "pnpm-lock.yaml",
  "index.html",
  // "package.json",
  "README.md",
  "vite.config.ts",
  "tsconfig.json",
  "tsconfig.node.json",
  "main.tsx",
]

export interface FileEntry {
  path: string
  type: "file" | "dir"
  name: string
  isSymlink: boolean
  children?: FileEntry[]
}

const normalizePath = (path: string) => {
  if (!path.startsWith(ROOT_PATH)) {
    return `${ROOT_PATH}${path.startsWith("/") ? path : `/${path}`}`
  }
  return path
}

const mapReaddirEntryToFileEntry = (
  entry: ReaddirEntry,
  parentPath: string,
): FileEntry => ({
  name: entry.name,
  path: `${parentPath === ROOT_PATH ? "" : parentPath}/${entry.name}`,
  type: entry.type === "directory" ? "dir" : "file",
  isSymlink: entry.isSymlink,
})

const loadDirectoryRecursively = async (
  sandbox: SandboxSession,
  path: string,
): Promise<FileEntry[]> => {
  const entries = await sandbox.fs.readdir(normalizePath(path))
  const filteredEntries = entries.filter(
    (entry) =>
      !EXCLUDED_NAMES.includes(entry.name) && !entry.name.startsWith("."),
  )
  const fileEntries = filteredEntries.map((entry) =>
    mapReaddirEntryToFileEntry(entry, path),
  )

  for (const entry of fileEntries) {
    if (entry.type === "dir") {
      entry.children = await loadDirectoryRecursively(sandbox, entry.path)
    }
  }

  return fileEntries
}

export const useFileSystem = (sandbox: SandboxSession | null) => {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [isTreeLoading, setIsTreeLoading] = useState(false)
  const [isFileLoading, setIsFileLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  console.log("files", files)

  const loadRootDirectory = useCallback(async () => {
    if (!sandbox) return
    setIsTreeLoading(true)
    try {
      const rootEntries = await loadDirectoryRecursively(sandbox, ROOT_PATH)
      setFiles(rootEntries)
    } catch (error) {
      console.error("Failed to load root directory:", error)
      toast.error("Failed to load project files")
      setFiles([])
    } finally {
      setIsTreeLoading(false)
    }
  }, [sandbox])

  useEffect(() => {
    loadRootDirectory()
  }, [loadRootDirectory])

  const loadFileContent = useCallback(
    async (filePath: string): Promise<string> => {
      if (!sandbox) throw new Error("Sandbox not available")
      setIsFileLoading(true)
      try {
        const content = await sandbox.fs.readTextFile(normalizePath(filePath))
        return content
      } catch (error) {
        console.error(`Failed to load file content for ${filePath}:`, error)
        toast.error(`Failed to load file`)
        throw error
      } finally {
        setIsFileLoading(false)
      }
    },
    [sandbox],
  )

  const saveFileContent = useCallback(
    (filePath: string, value: string) => {
      if (!sandbox) return

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        try {
          await sandbox.fs.writeTextFile(normalizePath(filePath), value)
        } catch (error) {
          console.error("Failed to save file:", error)
          toast.error(`Failed to save ${filePath.split("/").pop()}`)
        }
      }, 800)
    },
    [sandbox],
  )

  const createFile = useCallback(
    async (filePath: string) => {
      if (!sandbox) throw new Error("Sandbox not available")
      try {
        await sandbox.fs.writeTextFile(normalizePath(filePath), "")
        await loadRootDirectory()
      } catch (error) {
        console.error(`Failed to create file ${filePath}:`, error)
        toast.error(`Failed to create ${filePath.split("/").pop()}`)
        throw error
      }
    },
    [sandbox, loadRootDirectory],
  )

  const createDirectory = useCallback(
    async (dirPath: string) => {
      if (!sandbox) throw new Error("Sandbox not available")
      try {
        await sandbox.fs.mkdir(normalizePath(dirPath))
        await loadRootDirectory()
      } catch (error) {
        console.error(`Failed to create directory ${dirPath}:`, error)
        toast.error(`Failed to create directory ${dirPath.split("/").pop()}`)
        throw error
      }
    },
    [sandbox, loadRootDirectory],
  )

  const deleteEntry = useCallback(
    async (entryPath: string) => {
      if (!sandbox) throw new Error("Sandbox not available")
      try {
        let isDir = false
        try {
          const statResult = await sandbox.fs.stat(normalizePath(entryPath))
          isDir = statResult.type === "directory"
        } catch (statError) {
          console.warn(`Stat failed for ${entryPath} during delete:`, statError)
        }

        await sandbox.fs.remove(normalizePath(entryPath), isDir)
        await loadRootDirectory()
      } catch (error) {
        console.error(`Failed to delete ${entryPath}:`, error)
        toast.error(`Failed to delete ${entryPath.split("/").pop()}`)
        throw error
      }
    },
    [sandbox, loadRootDirectory],
  )

  return {
    files,
    isTreeLoading,
    isFileLoading,
    loadRootDirectory,
    loadFileContent,
    saveFileContent,
    createFile,
    createDirectory,
    deleteEntry,
  }
}
