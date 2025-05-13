export const connectToSandbox = async (
  shortSandboxId: string,
): Promise<{ startData: any; sandbox: any } | null> => {
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
      return await res.json()
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

export const createNewSandbox = async (
  userId: string,
): Promise<{
  sandboxId: string
}> => {
  const res = await fetch("/api/sandbox/new", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
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

export const editSandbox = async (
  shortSandboxId: string,
  updateData: Record<string, any>,
): Promise<{ success: boolean }> => {
  const res = await fetch("/api/sandbox/edit", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ shortSandboxId, ...updateData }),
  })

  if (!res.ok) throw new Error(await res.text())
  const response = await res.json()

  return { success: response.success }
}
