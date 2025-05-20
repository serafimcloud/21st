import { getUserData } from "@/lib/queries"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import {
  ExtendedDemoWithComponent,
  transformDemoResult,
} from "@/lib/utils/transformData"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import ShortUUID from "short-uuid"
import { StudioUsernameClient } from "./page.client"

// Get user data by username
const getUser = async (username: string) => {
  const { data: user } = await getUserData(supabaseWithAdminAccess, username)
  return user
}

// Get demos by user ID
const getUserDemos = async (userId: string) => {
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
}

// Get sandboxes by user ID
const getUserSandboxes = async (userId: string) => {
  const { data: sandboxesData, error } = await supabaseWithAdminAccess
    .from("sandboxes")
    .select("*")
    .eq("user_id", userId)
    .is("component_id", null)

  if (error) {
    console.error("Error fetching user sandboxes:", error)
    return []
  }

  // Transform sandboxes to ExtendedDemoWithComponent format
  const shortUUID = ShortUUID()
  return (sandboxesData || []).map(
    (sandbox): ExtendedDemoWithComponent => ({
      // @ts-ignore TODO FIX LATER
      id: shortUUID.fromUUID(sandbox.id), // Use short UUID if needed, or original ID if consistent
      name: sandbox.name || "Untitled Sandbox",
      created_at: sandbox.created_at,
      updated_at: sandbox.updated_at,
      submission_status: "draft", // Mark as draft
      is_private: true, // Sandboxes are typically private initially
      // Add default/null values for other required fields
      demo_slug: sandbox.id, // Use sandbox id as a placeholder slug
      preview_url: null,
      video_url: null,
      // @ts-ignore TODO FIX LATER
      component: null, // No linked component initially
      // @ts-ignore TODO FIX LATER
      user: null, // User data can be added if needed, but might not be necessary for table display
      component_user: null,
      total_count: 0,
      view_count: 0,
      bookmarks_count: 0,
      // @ts-ignore TODO FIX LATER
      bundle_url: null,
      // @ts-ignore TODO FIX LATER
      moderators_feedback: null,
    }),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const resolvedParams = await params
  const user = await getUser(resolvedParams.username)

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
  const user = await getUser(resolvedParams.username)
  if (!user) {
    redirect("/studio")
  }

  // Fetch demos and sandboxes
  const demos = await getUserDemos(user.id)
  const sandboxes = await getUserSandboxes(user.id)

  // Combine demos and sandboxes into a single list
  const combinedItems = [...demos, ...sandboxes]

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

  // Pass everything to the client component
  return (
    <StudioUsernameClient
      user={user}
      demos={combinedItems}
      isAdmin={isAdmin}
      isOwnProfile={isOwnProfile}
    />
  )
}
