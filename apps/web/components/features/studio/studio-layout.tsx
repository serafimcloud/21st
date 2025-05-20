"use client"

import { VersionSelectorDialog } from "@/components/features/publish/version-selector-dialog"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { User } from "@/types/global"
import { useSearchParams } from "next/navigation"
import { Dispatch, ReactNode, SetStateAction } from "react"
import { StudioHeader } from "./ui/studio-header"
import { StudioSidebar } from "./ui/studio-sidebar"

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
    <div className="flex flex-col relative">
      <SidebarProvider defaultOpen={true}>
        <StudioHeader user={user} />
        <div className="flex w-full">
          <StudioSidebar user={user} />
          <SidebarInset className="overflow-hidden p-4 md:p-8 !pt-20 w-full max-w-full">
            {children}
          </SidebarInset>
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
