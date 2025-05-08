"use client"

import { User } from "@/types/global"
import { StudioLayout } from "@/components/features/studio/studio-layout"
import { DemosTable } from "@/components/features/studio/ui/components-table"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { createNewSandbox } from "@/components/features/studio/sandbox/api"
import { useState, useEffect, useRef } from "react"
import { ExtendedDemoWithComponent } from "@/lib/utils/transformData"
import { Plus } from "lucide-react"

interface StudioUsernameClientProps {
  user: User
  demos: ExtendedDemoWithComponent[]
  isAdmin: boolean
  isOwnProfile: boolean
}

export function StudioUsernameClient({
  user,
  demos,
  isAdmin,
  isOwnProfile,
}: StudioUsernameClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isCreating, setIsCreating] = useState(false)
  const hasProcessedBeta = useRef(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const handleCreateNewSandbox = async () => {
    try {
      setIsCreating(true)
      const { sandboxId } = await createNewSandbox()
      setShowCreateDialog(false)
      router.push(`${pathname}/sandbox/${sandboxId}`)
    } catch (error) {
      console.error("Failed to create sandbox:", error)
      setIsCreating(false)
    }
  }

  const handleOpenSandbox = (shortSandboxId: string) => {
    router.push(`${pathname}/sandbox/${shortSandboxId}`)
  }

  // Show create dialog on ?new=true
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowCreateDialog(true)
    }
  }, [])

  // Auto-create sandbox if beta=true is in the URL
  useEffect(() => {
    const betaParam = searchParams.get("beta")
    if (
      betaParam === "true" &&
      !hasProcessedBeta.current &&
      (isOwnProfile || isAdmin)
    ) {
      hasProcessedBeta.current = true
      handleCreateNewSandbox()
    }
  }, [searchParams])

  return (
    <StudioLayout
      user={user}
      onCreateSandbox={handleCreateNewSandbox}
      isCreating={isCreating}
      showCreateDialog={showCreateDialog}
      setShowCreateDialog={setShowCreateDialog}
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-sm font-medium">Components</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Create and manage your UI components
          </p>
        </div>
        {(isOwnProfile || isAdmin) && (
          <Button
            onClick={() => setShowCreateDialog(true)}
            disabled={isCreating}
          >
            <div className="flex items-center gap-2 justify-center">
              <Plus className="h-4 w-4" />
              <span>Create</span>
            </div>
          </Button>
        )}
      </div>

      <div className="mt-4">
        <DemosTable demos={demos} onOpenSandbox={handleOpenSandbox} />
      </div>
    </StudioLayout>
  )
}
