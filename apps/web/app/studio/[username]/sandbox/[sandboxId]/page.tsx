"use client"

import { SandboxHeader } from "@/components/features/studio/sandbox/components/sandbox-header"
import { ServerSandbox } from "@/components/features/studio/sandbox/hooks/use-sandbox"
import { ArrowRight } from "lucide-react"
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation"
import { useState } from "react"
import PageClient from "./page.client"

export default function Page() {
  const { username, sandboxId } = useParams() as {
    username: string
    sandboxId: string
  }
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get("mode") === "edit"
  const [isNextLoading, setIsNextLoading] = useState(false)
  // Fetch sandbox metadata for header
  const [serverSandbox, setServerSandbox] = useState<ServerSandbox | null>(null)

  const handleNext = () => {
    setIsNextLoading(true)
    router.push(`${pathname}/publish`)
  }

  const handleBackFromEditMode = () => {
    router.back()
  }

  return (
    <>
      <SandboxHeader
        sandboxId={sandboxId}
        sandboxName={serverSandbox?.name}
        username={username}
        status={serverSandbox?.component_id ? "edit" : "draft"}
        customNextAction={handleNext}
        customNextIcon={<ArrowRight size={16} />}
        customNextLabel="Continue"
        isNextLoading={isNextLoading || !serverSandbox}
        customBackLabel={isEditMode ? "Back to component" : undefined}
        customBackAction={isEditMode ? handleBackFromEditMode : undefined}
      />
      <PageClient setServerSandbox={setServerSandbox} />
    </>
  )
}
