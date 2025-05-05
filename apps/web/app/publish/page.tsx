import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"

export default async function Page() {
  const { userId } = await auth()
  if (!userId) redirect("/")
  const { data: user } = await supabaseWithAdminAccess
    .from("users")
    .select("display_username,username")
    .eq("id", userId)
    .single()
  if (!user) redirect("/")
  const username = user.display_username || user.username
  if (!username) redirect("/")
  redirect(`/studio/${username}`)
}
