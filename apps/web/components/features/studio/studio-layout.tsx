"use client"

import { Dispatch, SetStateAction } from "react"
import { useSearchParams } from "next/navigation"
import { User } from "@/types/global"
import { ReactNode } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { VersionSelectorDialog } from "@/components/features/publish/version-selector-dialog"
import { StudioSidebar } from "./ui/studio-sidebar"
import { StudioHeader } from "./ui/studio-header"

interface StudioLayoutProps {
  user: User
  children: ReactNode
  onCreateSandbox?: () => Promise<void>
  isCreating?: boolean
  showCreateDialog?: boolean
  setShowCreateDialog?: Dispatch<SetStateAction<boolean>>
}

export function StudioLayout({
  user,
  children,
  onCreateSandbox,
  isCreating = false,
  showCreateDialog = false,
  setShowCreateDialog,
}: StudioLayoutProps) {
  const searchParams = useSearchParams()
  const username = user?.display_username || user?.username || undefined

  return (
    <div className="min-h-screen flex flex-col relative">
      <SidebarProvider defaultOpen={true}>
        <StudioHeader user={user} />
        <div className="flex pt-14 min-h-screen">
          <StudioSidebar user={user} />
          <SidebarInset className="p-8 w-full">{children}</SidebarInset>
        </div>
      </SidebarProvider>

      {setShowCreateDialog && (
        <VersionSelectorDialog
          isOpen={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          username={username}
          onCreateSandbox={onCreateSandbox}
          isCreating={isCreating}
        />
      )}
    </div>
  )
}
