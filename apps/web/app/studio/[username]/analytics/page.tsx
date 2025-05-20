import { StudioLayout } from "@/components/features/studio/studio-layout"
import { authUsernameOrRedirect } from "@/lib/user"
import { Metadata } from "next"
import { AnalyticsClient } from "./page.client"

export const metadata: Metadata = {
  title: "Analytics",
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { user } = await authUsernameOrRedirect(
    (await params).username,
    "/studio",
  )

  return (
    <StudioLayout user={user}>
      <div className="max-w-[640px] mx-auto w-full">
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-medium">Analytics</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Track your component performance and usage statistics
              </p>
            </div>
          </div>
          <AnalyticsClient userId={user.id} />
        </div>
      </div>
    </StudioLayout>
  )
}
