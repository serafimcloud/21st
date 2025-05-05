"use client"

import { useState, useEffect, Dispatch, SetStateAction } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/ui/header.client"
import { StudioSidebar } from "./ui/studio-sidebar"
import { User } from "@/types/global"
import { ReactNode } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { VersionSelectorDialog } from "@/components/features/publish/version-selector-dialog"

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
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <SidebarProvider defaultOpen={true}>
          <StudioSidebar user={user} />
          <SidebarInset className="p-8">{children}</SidebarInset>
        </SidebarProvider>
      </div>

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
