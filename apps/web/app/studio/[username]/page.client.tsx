"use client"

import { User } from "@/types/global"
import { Tables } from "@/types/supabase"
import { StudioLayout } from "@/components/features/studio/studio-layout"
import { ComponentsTable } from "@/components/features/studio/components-table"
import { PublishDialog } from "@/components/features/studio/publish-dialog"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type Component = Tables<"components">

interface StudioUsernameClientProps {
  user: User
  components: Component[]
  isAdmin: boolean
  isOwnProfile: boolean
}

export function StudioUsernameClient({
  user,
  components,
  isAdmin,
  isOwnProfile,
}: StudioUsernameClientProps) {
  return (
    <StudioLayout user={user}>
      <div className="space-y-8">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/studio"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-bold">Components</h1>
          </div>

          {(isOwnProfile || isAdmin) && <PublishDialog userId={user.id} />}
        </div>

        <ComponentsTable components={components} />
      </div>
    </StudioLayout>
  )
}
