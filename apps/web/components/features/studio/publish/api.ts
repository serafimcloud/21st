const API_BASE_URL = "http://localhost:8080"

export interface ProjectResponse {
  sandboxId: string
  startData: any
}

const fetchJSON = async (url: string, opts: RequestInit = {}) => {
  const res = await fetch(API_BASE_URL + url, opts)
  if (!res.ok) throw new Error(await res.text())

  return await res.json()
}

export const connectToServerSandbox = async (
  sandboxId?: string | null,
): Promise<ProjectResponse> => {
  if (sandboxId) {
    try {
      const startData = await fetchJSON(`/codesandbox/connect/${sandboxId}`, {
        method: "POST",
      })

      return { sandboxId, startData }
    } catch (error) {
      console.error("Failed to load existing sandbox:", error)
      return createNewSandbox()
    }
  }
  return createNewSandbox()
}

const createNewSandbox = async (): Promise<ProjectResponse> => {
  const { sandboxId, startData } = await fetchJSON("/codesandbox/create", {
    method: "POST",
  })

  return { sandboxId, startData }
}
