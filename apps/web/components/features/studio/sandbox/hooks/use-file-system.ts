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

  // Helper function to run a task, wait for specific output, and execute a callback
  const _runTaskAndWaitForOutput = async <T>(
    taskName: string,
    completionOutput: string,
    onComplete: (shell: any, sandbox: SandboxSession) => Promise<T | undefined>,
  ): Promise<T | undefined> => {
    // Guranties that the sandbox is connected
    if (!sandboxConnectionHash) {
      return new Promise((resolve, reject) => {
        let counter = 0
        const interval = setInterval(() => {
          if (sandboxConnectionHash) {
            clearInterval(interval)
            _runTaskAndWaitForOutput(taskName, completionOutput, onComplete)
              .then(resolve)
              .catch(reject)
          }
          counter++
          if (counter > 50) {
            clearInterval(interval)
            reject(new Error("Timeout waiting for sandbox connection"))
          }
        }, 1000)
      })
    }

    console.log(`Starting ${taskName} task...`)
    if (!sandboxRef.current) {
      throw new Error("Sandbox not available")
    }
    const task = await sandboxRef.current.tasks.runTask(taskName)

    if (!task) {
      throw new Error(`Failed to start ${taskName} task`)
    }

    console.log(`${taskName} Task:`, task)

    return new Promise<T | undefined>((resolve, reject) => {
      let counter = 0
      const interval = setInterval(async () => {
        if (!task?.shellId) {
          counter++
          if (counter > 50) {
            clearInterval(interval)
            reject(new Error(`Timeout waiting for ${taskName} shellId`))
          }
          return
        }

        let connectedShell
        try {
          if (!sandboxRef.current) {
            throw new Error("Sandbox disconnected while waiting for shell")
          }
          connectedShell = await sandboxRef.current.shells.open(task.shellId)
        } catch (error) {
          console.error(`Failed to open shell for ${taskName}:`, error)
          counter++
          if (counter > 50) {
            clearInterval(interval)
            reject(new Error(`Timeout connecting to ${taskName} shell`))
          }
          return
        }

        if (connectedShell) {
          clearInterval(interval)

          let outputTimeout: NodeJS.Timeout | null = null
          const disposeShellAndClearTimeout = () => {
            if (outputTimeout) clearTimeout(outputTimeout)
            connectedShell?.dispose()
          }

          connectedShell.onOutput(async (data) => {
            console.log(`${taskName} Output:`, data)
            if (data.includes(completionOutput)) {
              console.log(
                `${taskName} finished, executing onComplete callback...`,
              )
              try {
                if (!sandboxRef.current) {
                  throw new Error("Sandbox disconnected before onComplete")
                }
                const result = await onComplete(
                  connectedShell,
                  sandboxRef.current,
                )
                console.log(`${taskName} onComplete finished successfully.`)
                disposeShellAndClearTimeout()
                resolve(result)
              } catch (error) {
                console.error(`Error during ${taskName} onComplete:`, error)
                disposeShellAndClearTimeout()
                reject(error)
              }
            }
          })

          outputTimeout = setTimeout(() => {
            console.error(`Timeout waiting for '${completionOutput}' message.`)
            disposeShellAndClearTimeout()
            reject(new Error(`${taskName}: Timeout waiting for output`))
          }, 120000) // Increased timeout to 120 seconds

          // Wrap resolve/reject to clear timeout
          const originalResolve = resolve
          resolve = (value) => {
            disposeShellAndClearTimeout()
            originalResolve(value)
          }
          const originalReject = reject
          reject = (reason) => {
            disposeShellAndClearTimeout()
            originalReject(reason)
          }
        } else {
          counter++
          if (counter > 50) {
            clearInterval(interval)
            reject(new Error(`Timeout connecting to ${taskName} shell`))
          }
        }
      }, 1000)
    })
  }

  const bundleDemo = async (): Promise<string | undefined> => {
    return _runTaskAndWaitForOutput<string>(
      "build",
      "built in",
      async (shell, sandbox) => {
        const content = await getContentOfBundleIndexHTML(sandbox)
        if (!content) {
          throw new Error("Failed to read dist/index.html")
        }
        return content
      },
    )
  }

  // Function to compile the project into a shadcn registry
  const generateRegistry = async (): Promise<
    | {
        componentRegistryJSON: string
        demoRegistryJSON: string
      }
    | undefined
  > => {
    return _runTaskAndWaitForOutput<
      | {
          componentRegistryJSON: string
          demoRegistryJSON: string
        }
      | undefined
    >("generate:registry", "FINISH", async (shell, sandbox) => {
      const componentRegistryJSON =
        await getContentOfComponentRegistryJSON(sandbox)
      const demoRegistryJSON = await getContentOfDemoRegistryJSON(sandbox)
      if (!componentRegistryJSON || !demoRegistryJSON) {
        throw new Error("Failed to read generated registry files")
      }
      return { componentRegistryJSON, demoRegistryJSON }
    })
  }

  const getContentOfBundleIndexHTML = async (sandbox: SandboxSession) => {
    const indexPath = normalizePath("dist/index.html")
    const content = await sandbox.fs.readTextFile(indexPath)
    return content
  }

  const getContentOfComponentRegistryJSON = async (sandbox: SandboxSession) => {
    const registryJsonPath = normalizePath("public/r/component.json")
    const content = await sandbox.fs.readTextFile(registryJsonPath)
    return content
  }

  const getContentOfDemoRegistryJSON = async (sandbox: SandboxSession) => {
    const registryJsonPath = normalizePath("public/r/demo.json")
    const content = await sandbox.fs.readTextFile(registryJsonPath)
    return content
  }

  return {
    files,
    isTreeLoading,
    isFileLoading,
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
    bundleDemo,
    // getContentOfComponentRegistryJSON, // Keep these private
    // getContentOfDemoRegistryJSON,
  }
}
