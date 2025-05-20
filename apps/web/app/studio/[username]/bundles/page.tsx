import { StudioLayout } from "@/components/features/studio/studio-layout"
import { authUsernameOrRedirect } from "@/lib/user"
import { Metadata } from "next"
import { BundlesClient } from "./page.client"

export const metadata: Metadata = {
  title: "Bundles",
}

export default async function BundlesPage({
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
      <BundlesClient user={user} />
    </StudioLayout>
  )
}
