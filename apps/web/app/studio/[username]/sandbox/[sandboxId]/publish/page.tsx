"use client"

import { useParams } from "next/navigation"
import { useState, useRef } from "react"
import { SandboxHeader } from "@/components/features/studio/sandbox/components/sandbox-header"
import { useSandbox } from "@/components/features/studio/sandbox/hooks/use-sandbox"
import PageClient from "./page.client"

export default function Page() {
  const { username, sandboxId } = useParams() as {
    username: string
    sandboxId: string
  }
  const [isNextLoading, setIsNextLoading] = useState(false)

  const submitHandlerRef = useRef<(() => void) | null>(null)

  // Fetch sandbox metadata for header
  const { serverSandbox } = useSandbox({ sandboxId })

  // const handleSubmitStatusChange = useCallback((isSubmitting: boolean) => {
  //   setIsNextLoading(isSubmitting)
  // }, [])

  const handleSubmit = () => {
    if (submitHandlerRef.current) {
      submitHandlerRef.current()
    }
  }

  return (
    <>
      <SandboxHeader
        sandboxId={sandboxId}
        sandboxName={serverSandbox?.name}
        username={username}
        status={serverSandbox?.component_id ? "edit" : "draft"}
        showEditName={false}
        customBackLabel="Back to edit"
        customBackUrl={`/studio/${username}/sandbox/${sandboxId}`}
        customNextLabel={isNextLoading ? "Submitting..." : "Send to review"}
        customNextAction={handleSubmit}
        hideNext={false}
        isNextLoading={isNextLoading}
      />
      <PageClient submitHandlerRef={submitHandlerRef} />
    </>
  )
}
