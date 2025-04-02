import { redirect } from "next/navigation"
import { Footer } from "@/components/ui/footer"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { auth } from "@clerk/nextjs/server"
import { unstable_cache } from "next/cache"
import { getUserData } from "@/lib/queries"
import { StudioUsernameClient } from "./page.client"
import { transformDemoResult } from "@/lib/utils/transformData"

// Get user data by username
const getCachedUser = unstable_cache(
  async (username: string) => {
    const { data: user } = await getUserData(supabaseWithAdminAccess, username)
    return user
  },
  ["user-data"],
  {
    revalidate: 30,
    tags: ["user-data"],
  },
)

// Get demos by user ID
const getCachedUserDemos = unstable_cache(
  async (userId: string) => {
    const { data: demos, error } = await supabaseWithAdminAccess.rpc(
      "get_user_profile_demo_list_v2",
      {
        p_user_id: userId,
      },
    )

    if (error) {
      console.error("Error fetching user demos:", error)
      return []
    }

    return demos ? demos.map(transformDemoResult) : []
  },
  ["user-demos"],
  {
    revalidate: 30,
    tags: ["user-demos"],
  },
)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const resolvedParams = await params
  const user = await getCachedUser(resolvedParams.username)

  if (!user) {
    return {
      title: "User Not Found | Studio",
    }
  }

  return {
    title: `${user.display_name || user.name || user.username}'s Studio | 21st.dev`,
    description: `Manage components by ${user.display_name || user.name || user.username} on 21st.dev`,
  }
}

export default async function StudioUsernamePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  // Verify user is authenticated
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in")
  }

  // Get the resolved params
  const resolvedParams = await params

  // Get the target user from the URL
  const user = await getCachedUser(resolvedParams.username)
  if (!user) {
    redirect("/studio")
  }

  // Verify logged in user has access to this user's components
  // Admin can access any user's components, users can only access their own
  const { data: currentUser } = await supabaseWithAdminAccess
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .single()

  const isAdmin = currentUser?.is_admin || false
  const isOwnProfile = userId === user.id

  if (!isAdmin && !isOwnProfile) {
    redirect("/studio")
  }

  // Get demos for the specified user
  const demos = await getCachedUserDemos(user.id)

  // Pass everything to the client component
  return (
    <StudioUsernameClient
      user={user}
      demos={demos}
      isAdmin={isAdmin}
      isOwnProfile={isOwnProfile}
    />
  )
}
