"use client"

import { User, DemoWithComponent } from "@/types/global"
import { StudioLayout } from "@/components/features/studio/studio-layout"
import { ComponentsTable } from "@/components/features/studio/components-table"
import { PublishDialog } from "@/components/features/studio/publish/publish-dialog"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface StudioUsernameClientProps {
  user: User
  demos: DemoWithComponent[]
  isAdmin: boolean
  isOwnProfile: boolean
}

export function StudioUsernameClient({
  user,
  demos,
  isAdmin,
  isOwnProfile,
}: StudioUsernameClientProps) {
  return (
    <StudioLayout user={user}>
      <div className="space-y-6">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/studio"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl font-bold">Components</h1>
          </div>

          {(isOwnProfile || isAdmin) && <PublishDialog userId={user.id} />}
        </div>

        <ComponentsTable demos={demos} />
      </div>
    </StudioLayout>
  )
}
