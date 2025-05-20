import { authUsernameOrRedirect } from "@/lib/user"

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ username: string }>
  children: React.ReactNode
}) {
  await authUsernameOrRedirect((await params).username, "/studio")
  return <>{children}</>
}
