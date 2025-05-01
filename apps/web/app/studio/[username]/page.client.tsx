"use client"

import { User, DemoWithComponent } from "@/types/global"
import { StudioLayout } from "@/components/features/studio/studio-layout"
import { DemosTable } from "@/components/features/studio/ui/components-table"
import { SandboxesTable } from "@/components/features/studio/ui/sandboxes-table"
import Link from "next/link"
import { ArrowLeft, PlusCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import { createNewSandbox } from "@/components/features/studio/sandbox/api"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
            <Button onClick={handleCreateNewSandbox} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              Create new component
            </Button>
          )}
        </div>

        <Tabs defaultValue="components">
          <TabsList>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="sandboxes">Sandboxes</TabsTrigger>
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
