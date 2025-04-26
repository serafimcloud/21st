export const connectToSandbox = async (
  shortSandboxId: string,
): Promise<{ startData: any } | null> => {
  let retries = 3
  while (retries > 0) {
    try {
      const res = await fetch(`/api/sandbox/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shortSandboxId }),
      })

      if (!res.ok) throw new Error(await res.text())
      const response = await res.json()

      return { startData: response.startData }
    } catch (error) {
      console.error(
        `Failed to load existing sandbox (${retries} retries left):`,
        error,
      )
      retries--
      if (retries === 0) return null
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  return null
}

export const createNewSandbox = async (): Promise<{
  sandboxId: string
}> => {
  const res = await fetch("/api/sandbox/new", {
    method: "POST",
  })

  if (!res.ok) throw new Error(await res.text())
  const response = await res.json()

  return { sandboxId: response.shortSandboxId }
}

export const publishSandbox = async (
  shortSandboxId: string,
): Promise<{ success: boolean }> => {
  const res = await fetch("/api/sandbox/publish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ shortSandboxId }),
  })

  if (!res.ok) throw new Error(await res.text())
  const response = await res.json()

  return { success: response.success }
}
