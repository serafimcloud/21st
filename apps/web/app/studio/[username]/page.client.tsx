"use client"

import { User } from "@/types/global"
import { StudioLayout } from "@/components/features/studio/studio-layout"
import { DemosTable } from "@/components/features/studio/ui/components-table"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import { createNewSandbox } from "@/components/features/studio/sandbox/api"
import { useState } from "react"
import { Spinner } from "@/components/icons/spinner"
import { cn } from "@/lib/utils"
import { ExtendedDemoWithComponent } from "@/lib/utils/transformData"

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
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateNewSandbox = async () => {
    try {
      setIsCreating(true)
      const { sandboxId } = await createNewSandbox()
      router.push(`${pathname}/sandbox/${sandboxId}`)
    } catch (error) {
      console.error("Failed to create sandbox:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenSandbox = (item: ExtendedDemoWithComponent) => {
    router.push(`${pathname}/sandbox/${item.id}`)
  }

  return (
    <StudioLayout user={user}>
      <div className="space-y-6">
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-xl font-bold">Components</h1>
          {(isOwnProfile || isAdmin) && (
            <Button
              onClick={handleCreateNewSandbox}
              disabled={isCreating}
              className={cn(
                "transition-[width] duration-200",
                isCreating ? "w-[120px]" : "w-[80px]",
              )}
            >
              <div className="flex items-center gap-2 justify-center w-full">
                {isCreating ? (
                  <>
                    <Spinner size={16} color="white" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create</span>
                )}
              </div>
            </Button>
          )}
        </div>

        <div className="mt-4">
          <DemosTable demos={demos} onOpenSandbox={handleOpenSandbox} />
        </div>
      </div>
    </StudioLayout>
  )
}
