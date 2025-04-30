import { SandboxSession, ReaddirEntry } from "@codesandbox/sdk"
import { useState, useEffect, useRef, RefObject } from "react"
import { toast } from "sonner"

const ROOT_PATH = "/project/sandbox"

const ALWAYS_HIDDEN_FILES = [
  "node_modules",
  "dist",
  "yarn.lock",
  "vite-env.d.ts",
  "public",
  "pnpm-lock.yaml",
  "vite.config.ts",
  "tsconfig.json",
  "tsconfig.node.json",
  "index.html",
  "main.tsx",
  "README.md",
  "components.json",
  "app.tsx",
  "scripts",
  "registry.json",
]
const ADVANCED_VIEW_HIDDEN_FILES = [
  "package.json",
  "app.tsx",
  "lib",
  // "components",
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
  showAdvancedView: boolean,
): Promise<FileEntry[]> => {
  const entries = await sandbox.fs.readdir(normalizePath(path))

  const filteredEntries = entries.filter((entry) => {
    // Always filter out certain files
    if (
      ALWAYS_HIDDEN_FILES.includes(entry.name) ||
      entry.name.startsWith(".")
    ) {
      return false
    }

    // Filter out advanced view files only if not in advanced mode
    if (!showAdvancedView && ADVANCED_VIEW_HIDDEN_FILES.includes(entry.name)) {
      return false
    }

    return true
  })
  const fileEntries = filteredEntries.map((entry) =>
    mapReaddirEntryToFileEntry(entry, path),
  )

  for (const entry of fileEntries) {
    if (entry.type === "dir") {
      entry.children = await loadDirectoryRecursively(
        sandbox,
        entry.path,
        showAdvancedView,
      )
    }
  }

  return fileEntries
}

export const useFileSystem = ({
  sandboxRef,
  reconnectSandbox,
  sandboxConnectionHash,
  connectedShellId,
}: {
  sandboxRef: RefObject<SandboxSession | null>
  reconnectSandbox: () => Promise<void>
  sandboxConnectionHash: string | null
  connectedShellId: string | null
}) => {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [isTreeLoading, setIsTreeLoading] = useState(false)
  const [isFileLoading, setIsFileLoading] = useState(false)
  const [isCompiling, setIsCompiling] = useState(false)
  const [advancedView, setAdvancedView] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const sbWrapper = async <T>(
    operation: (sandbox: SandboxSession) => Promise<T>,
  ): Promise<T | undefined> => {
    if (!sandboxRef.current) return

    try {
      return await operation(sandboxRef.current)
    } catch (error) {
      try {
        await reconnectSandbox()
        if (!sandboxRef.current) throw new Error("Failed to reconnect sandbox")
        return await operation(sandboxRef.current)
      } catch (error) {
        console.error("Failed to execute operation:", error)
        throw error
      }
    }
  }

  const loadRootDirectory = async () => {
    setIsTreeLoading(true)
    try {
      const rootEntries = await sbWrapper((sandbox) =>
        loadDirectoryRecursively(sandbox, ROOT_PATH, advancedView),
      )
      if (rootEntries) setFiles(rootEntries)
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
  }, [sandboxConnectionHash, advancedView])

  const loadFileContent = async (filePath: string): Promise<string> => {
    setIsFileLoading(true)
    try {
      const content = await sbWrapper((sandbox) =>
        sandbox.fs.readTextFile(normalizePath(filePath)),
      )
      if (!content) throw new Error("Failed to load file content")
      return content
    } catch (error) {
      console.error(`Failed to load file content for ${filePath}:`, error)
      toast.error(`Failed to load file`)
      throw error
    } finally {
      setIsFileLoading(false)
    }
  }

  const saveFileContent = (filePath: string, value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        await sbWrapper((sandbox) =>
          sandbox.fs.writeTextFile(normalizePath(filePath), value),
        )
      } catch (error) {
        console.error("Failed to save file:", error)
        toast.error(`Failed to save ${filePath.split("/").pop()}`)
      }
    }, 800)
  }

  const createFile = async (filePath: string) => {
    try {
      await sbWrapper((sandbox) =>
        sandbox.fs.writeTextFile(normalizePath(filePath), "// TODO: Add code"),
      )
      await loadRootDirectory()
    } catch (error) {
      console.error(`Failed to create file ${filePath}:`, error)
      toast.error(`Failed to create ${filePath.split("/").pop()}`)
      throw error
    }
  }

  const createDirectory = async (dirPath: string) => {
    try {
      await sbWrapper((sandbox) => sandbox.fs.mkdir(normalizePath(dirPath)))
      await loadRootDirectory()
    } catch (error) {
      console.error(`Failed to create directory ${dirPath}:`, error)
      toast.error(`Failed to create directory ${dirPath.split("/").pop()}`)
      throw error
    }
  }

  const deleteEntry = async (entryPath: string) => {
    try {
      await sbWrapper(async (sandbox) => {
        let isDir = false
        try {
          const statResult = await sandbox.fs.stat(normalizePath(entryPath))
          isDir = statResult.type === "directory"
        } catch (statError) {
          console.warn(`Stat failed for ${entryPath} during delete:`, statError)
        }

        return sandbox.fs.remove(normalizePath(entryPath), isDir)
      })
      await loadRootDirectory()
    } catch (error) {
      console.error(`Failed to delete ${entryPath}:`, error)
      toast.error(`Failed to delete ${entryPath.split("/").pop()}`)
      throw error
    }
  }

  const renameEntry = async (oldPath: string, newName: string) => {
    try {
      const pathParts = oldPath.split("/")
      const parentPath = pathParts.slice(0, -1).join("/")
      const newPath = `${parentPath ? parentPath + "/" : ""}${newName}`

      await sbWrapper((sandbox) =>
        sandbox.fs.rename(normalizePath(oldPath), normalizePath(newPath)),
      )

      await loadRootDirectory()
      return newPath
    } catch (error) {
      console.error(`Failed to rename ${oldPath} to ${newName}:`, error)
      toast.error(`Failed to rename to ${newName}`)
      throw error
    }
  }

  const addDependencyToPackageJson = async (
    packageName: string,
    version: string,
  ) => {
    try {
      const packageJsonPath = normalizePath("/package.json")
      const content = await sbWrapper((sandbox) =>
        sandbox.fs.readTextFile(packageJsonPath),
      )

      if (!content) throw new Error("Failed to read package.json")

      const packageJson = JSON.parse(content)
      if (!packageJson.dependencies) {
        packageJson.dependencies = {}
      }

      packageJson.dependencies[packageName] = `^${version}`

      await sbWrapper((sandbox) =>
        sandbox.fs.writeTextFile(
          packageJsonPath,
          JSON.stringify(packageJson, null, 2),
        ),
      )

      toast.success(`Added ${packageName}@${version} to dependencies`)
      await loadRootDirectory()
    } catch (error) {
      console.error(`Failed to add dependency ${packageName}:`, error)
      toast.error(`Failed to add ${packageName} to dependencies`)
      throw error
    }
  }

  const toggleAdvancedView = () => {
    setAdvancedView((prev) => !prev)
  }

  // Function to compile the project into a shadcn registry
  const generateRegistry = async (): Promise<{
    componentRegistryJSON: string
    demoRegistryJSON: string
  }> => {
    if (!connectedShellId) {
      return new Promise((resolve, reject) => {
        let counter = 0
        const interval = setInterval(() => {
          if (connectedShellId) {
            clearInterval(interval)
            generateRegistry().then(resolve).catch(reject)
          }
          counter++
          if (counter > 50) {
            clearInterval(interval)
            reject(new Error("Timeout waiting for shell connection"))
          }
        }, 1000)
      })
    }

    console.log("Generating registry...")
    const task = await sbWrapper((sandbox) =>
      sandbox.tasks.runTask("generate:registry"),
    )
    setIsCompiling(true)

    console.log("Task:", task)

    return new Promise<{
      componentRegistryJSON: string
      demoRegistryJSON: string
    }>((resolve, reject) => {
      let counter = 0
      const interval = setInterval(async () => {
        const shells = await sandboxRef.current?.shells.getShells()
        const shell = shells?.find((shell) => shell.id === task?.shellId)

        if (!shell) {
          counter++
          if (counter > 35) {
            clearInterval(interval)
            reject(new Error("Shell not found"))
          }
          return
        }

        const connectedShell = await sandboxRef.current?.shells.open(shell.id)

        if (connectedShell) {
          clearInterval(interval)
          connectedShell.onOutput(async (data) => {
            if (data.includes("FINISH")) {
              setIsCompiling(false)
              try {
                const componentRegistryJSON =
                  await getContentOfComponentRegistryJSON()
                const demoRegistryJSON = await getContentOfDemoRegistryJSON()
                connectedShell.dispose()
                if (!componentRegistryJSON || !demoRegistryJSON) {
                  throw new Error("Failed to generate registry")
                }
                resolve({ componentRegistryJSON, demoRegistryJSON })
              } catch (error) {
                reject(error)
              }
            }
          })
        }

        counter++
        if (counter > 50) {
          clearInterval(interval)
          reject(new Error("Timeout"))
        }
      }, 1000)
    })
  }

  const getContentOfComponentRegistryJSON = async () => {
    const registryJsonPath = normalizePath("public/r/component.json")
    const content = await sbWrapper((sandbox) =>
      sandbox.fs.readTextFile(registryJsonPath),
    )
    return content
  }

  const getContentOfDemoRegistryJSON = async () => {
    const registryJsonPath = normalizePath("public/r/demo.json")
    const content = await sbWrapper((sandbox) =>
      sandbox.fs.readTextFile(registryJsonPath),
    )
    return content
  }

  return {
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
    createDirectory,
    deleteEntry,
    renameEntry,
    addDependencyToPackageJson,
    // registry
    generateRegistry,
    // getContentOfComponentRegistryJSON,
    // getContentOfDemoRegistryJSON,
  }
}
