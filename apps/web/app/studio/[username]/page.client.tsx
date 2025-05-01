"use client"

import { User, DemoWithComponent } from "@/types/global"
import { StudioLayout } from "@/components/features/studio/studio-layout"
import { DemosTable } from "@/components/features/studio/ui/components-table"
import { SandboxesTable } from "@/components/features/studio/ui/sandboxes-table"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import { createNewSandbox } from "@/components/features/studio/sandbox/api"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/icons/spinner"
import { cn } from "@/lib/utils"

interface StudioUsernameClientProps {
  user: User
  demos: DemoWithComponent[]
  sandboxes: any[]
  isAdmin: boolean
  isOwnProfile: boolean
}

export function StudioUsernameClient({
  user,
  demos,
  sandboxes,
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

  const handleOpenSandbox = (sandbox: any) => {
    router.push(`${pathname}/sandbox/${sandbox.id}`)
  }

  return (
    <StudioLayout user={user}>
      <div className="space-y-6">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">Components</h1>
          </div>

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
        <Tabs defaultValue="components" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4 rounded-md h-7 p-0.5 w-[200px]">
            <TabsTrigger className="text-xs h-6" value="components">
              Components
            </TabsTrigger>
            <TabsTrigger className="text-xs h-6" value="sandboxes">
              Sandboxes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="components" className="mt-4">
            <DemosTable demos={demos} />
          </TabsContent>
          <TabsContent value="sandboxes" className="mt-4">
            <SandboxesTable sandboxes={sandboxes} onOpen={handleOpenSandbox} />
          </TabsContent>
        </Tabs>
      </div>
    </StudioLayout>
  )
}
