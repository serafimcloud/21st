const API_BASE_URL = "http://localhost:8080"

export interface FileEntry {
  name: string
  type: "file" | "dir"
  path: string
  children?: FileEntry[]
}

export interface ProjectResponse {
  projectId: string
  previewURL: string
}

const fetchJSON = async (url: string, opts: RequestInit = {}) => {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`
  const res = await fetch(fullUrl, opts)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const initializeProject = async (
  existingProjectId?: string | null,
): Promise<ProjectResponse> => {
  if (existingProjectId) {
    try {
      const { previewURL } = await fetchJSON(`/projects/${existingProjectId}`)
      return { projectId: existingProjectId, previewURL }
    } catch (error) {
      console.error("Failed to load existing sandbox:", error)
      return createNewProject()
    }
  }
  return createNewProject()
}

export const createNewProject = async (): Promise<ProjectResponse> => {
  const { projectId, previewURL } = await fetchJSON("/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ template: "nextjs-builder" }),
  })
  return { projectId, previewURL }
}

export const fetchFileTree = async (
  projectId: string,
): Promise<FileEntry[]> => {
  const fileEntries = await fetchJSON(`/projects/${projectId}/files`)
  return fileEntries.map((entry: any) => ({
    name: entry.name,
    type: entry.type,
    path: entry.path.replace(/^\/home\/user/, ""),
  }))
}

export const fetchDirectoryContent = async (
  projectId: string,
  dirPath: string,
): Promise<FileEntry[]> => {
  const dirEntries = await fetchJSON(
    `/projects/${projectId}/dir?path=${encodeURIComponent(dirPath)}`,
  )
  return dirEntries.map((entry: any) => ({
    name: entry.name,
    type: entry.type,
    path: entry.path.replace(/^\/home\/user/, ""),
  }))
}

export const loadFileContent = async (
  projectId: string,
  filePath: string,
): Promise<string> => {
  const cleanPath = filePath.replace(/^\/home\/user/, "")
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/file?path=${encodeURIComponent(cleanPath)}`,
  )
  if (!response.ok) throw new Error(await response.text())
  return response.text()
}

export const saveFileContent = async (
  projectId: string,
  filePath: string,
  content: string,
): Promise<void> => {
  const cleanPath = filePath.replace(/^\/home\/user/, "")
  await fetchJSON(
    `/projects/${projectId}/file?path=${encodeURIComponent(cleanPath)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
  )
}

export const createFile = async (
  projectId: string,
  filePath: string,
): Promise<void> => {
  const cleanPath = filePath.startsWith("/") ? filePath : `/${filePath}`
  await fetchJSON(
    `/projects/${projectId}/file?path=${encodeURIComponent(cleanPath)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "" }),
    },
  )
}

export const deleteFile = async (
  projectId: string,
  filePath: string,
): Promise<void> => {
  const cleanPath = filePath.replace(/^\/home\/user/, "")
  await fetchJSON(
    `/projects/${projectId}/file?path=${encodeURIComponent(cleanPath)}`,
    {
      method: "DELETE",
    },
  )
}
