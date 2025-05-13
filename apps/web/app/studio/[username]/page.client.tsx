"use client"

import { User } from "@/types/global"
import { StudioLayout } from "@/components/features/studio/studio-layout"
import { DemosTable } from "@/components/features/studio/ui/components-table"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { createNewSandbox } from "@/components/features/studio/sandbox/api"
import { useState, useEffect, useRef, useCallback } from "react"
import { ExtendedDemoWithComponent } from "@/lib/utils/transformData"
import { Plus } from "lucide-react"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { toast } from "sonner"
import { SuccessDialog } from "@/components/features/publish/components/success-dialog"

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
  const supabase = useClerkSupabaseClient()
  const [localDemos, setLocalDemos] =
    useState<ExtendedDemoWithComponent[]>(demos)

  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successDialogData, setSuccessDialogData] = useState<{
    componentSlug: string
    username: string
    demoSlug: string
  } | null>(null)

  useEffect(() => {
    setLocalDemos(demos)
  }, [demos])

  const handleCreateNewSandbox = async () => {
    try {
      setIsCreating(true)
      const { sandboxId } = await createNewSandbox(user.id)
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

  const handleUpdateVisibility = async (
    componentId: number,
    isPrivate: boolean,
  ) => {
    try {
      // Update in Supabase - change to use is_public (which is the inverse of isPrivate)
      const { error } = await supabase
        .from("components")
        .update({ is_public: !isPrivate } as any) // inverting the boolean
        .eq("id", componentId)

      if (error) {
        throw error
      }

      // Update local state
      setLocalDemos((prevDemos) =>
        prevDemos.map((demo) =>
          demo?.component?.id === componentId
            ? { ...demo, is_private: isPrivate }
            : demo,
        ),
      )

      toast.success(`Component is now ${isPrivate ? "private" : "public"}`)
    } catch (error) {
      console.error("Failed to update visibility:", error)
      toast.error("Failed to update visibility")
      throw error
    }
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
  }, [searchParams, handleCreateNewSandbox, isOwnProfile, isAdmin])

  useEffect(() => {
    const publishSuccess = searchParams.get("publishSuccess")
    const componentSlug = searchParams.get("componentSlug")
    const username = searchParams.get("username")
    const demoSlug = searchParams.get("demoSlug")

    if (publishSuccess === "true" && componentSlug && username && demoSlug) {
      setSuccessDialogData({ componentSlug, username, demoSlug })
      setShowSuccessDialog(true)

      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete("publishSuccess")
      newSearchParams.delete("componentSlug")
      newSearchParams.delete("username")
      newSearchParams.delete("demoSlug")
      router.replace(`${pathname}?${newSearchParams.toString()}`)
    }
  }, [searchParams, router, pathname])

  const handleGoToComponentDialog = useCallback(() => {
    if (successDialogData) {
      const { username, componentSlug, demoSlug } = successDialogData
      router.push(`/${username}/${componentSlug}/${demoSlug}`)
    }
    setShowSuccessDialog(false)
  }, [successDialogData, router])

  const handleAddAnotherDialog = useCallback(() => {
    setShowCreateDialog(true) // Open the create new sandbox dialog
    setShowSuccessDialog(false)
  }, [setShowCreateDialog])

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
        <DemosTable
          demos={localDemos}
          onOpenSandbox={handleOpenSandbox}
          onUpdateVisibility={
            isOwnProfile || isAdmin ? handleUpdateVisibility : undefined
          }
          isOwnProfile={isOwnProfile || isAdmin}
        />
      </div>
      <SuccessDialog
        isOpen={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        onAddAnother={handleAddAnotherDialog}
        onGoToComponent={handleGoToComponentDialog}
        mode={"component"}
      />
    </StudioLayout>
  )
}
