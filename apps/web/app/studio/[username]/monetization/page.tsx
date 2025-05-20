import { StudioLayout } from "@/components/features/studio/studio-layout"
import { authUsernameOrRedirect } from "@/lib/user"
import { Metadata } from "next"
import { MonetizationClient } from "./page.client"

export const metadata: Metadata = {
  title: "Monetization",
}

export default async function MonetizationPage({
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
        <MonetizationClient userId={user.id} />
      </div>
    </StudioLayout>
  )
}
