"use client"

import { useEffect, useState } from "react"
import { connectToSandbox } from "@codesandbox/sdk/browser"
import { SandboxSession, SandboxClient } from "@codesandbox/sdk"

const PublishPage = () => {
  const [status, setStatus] = useState("Connecting...")
  const [sandbox, setSandbox] = useState<SandboxSession | null>(null)

  useEffect(() => {
    const connect = async () => {
      try {
        const response = await fetch(
          "http://localhost:8080/codesandbox/create",
          {
            method: "POST",
          },
        )

        const startData = await response.json()

        console.log("Start data:", startData)

        const sandbox = await connectToSandbox(startData)
        setStatus("Connected to sandbox!")
        setSandbox(sandbox)
        console.log("Sandbox connected:", sandbox)
      } catch (error: any) {
        setStatus("Failed to connect: " + error.message)
        console.error("Connection error:", error)
      }
    }

    connect()
  }, [])

  useEffect(() => {
    if (sandbox) {
      console.log("Sandbox:", sandbox)
    }
  }, [sandbox])

  return <div>{status}</div>
}

export default PublishPage
