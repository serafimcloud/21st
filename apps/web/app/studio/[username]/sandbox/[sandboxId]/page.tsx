"use client"

import { useParams } from "next/navigation"
import { SandboxHeader } from "@/components/features/studio/sandbox/components/sandbox-header"
import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"
import {
  ServerSandbox,
  useSandbox,
} from "@/components/features/studio/sandbox/hooks/use-sandbox"
import PageClient from "./page.client"

export default function Page() {
  const { username, sandboxId } = useParams() as {
    username: string
    sandboxId: string
  }
  const router = useRouter()
  const pathname = usePathname()
  const [isNextLoading, setIsNextLoading] = useState(false)
  // Fetch sandbox metadata for header
  const [serverSandbox, setServerSandbox] = useState<ServerSandbox | null>(null)

  const handleNext = () => {
    setIsNextLoading(true)
    router.push(`${pathname}/publish`)
  }

  return (
    <>
      <SandboxHeader
        sandboxId={sandboxId}
        sandboxName={serverSandbox?.name}
        username={username}
        customNextAction={handleNext}
        isNextLoading={isNextLoading || !serverSandbox}
      />
      <PageClient setServerSandbox={setServerSandbox} />
    </>
  )
}
