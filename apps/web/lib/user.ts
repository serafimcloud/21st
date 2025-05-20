import { Bundle } from "@/types/global"
import { auth } from "@clerk/nextjs/server"
import { unstable_cache } from "next/cache"
import { redirect } from "next/navigation"
import { authUsername, getUserData } from "./queries"
import { supabaseWithAdminAccess } from "./supabase"
import { transformDemoResult } from "./utils/transformData"

export const authUsernameCached = unstable_cache(
  async (userId: string, targetUsername: string) =>
    authUsername(supabaseWithAdminAccess, userId, targetUsername),
  ["auth-username"],
  {
    revalidate: 30,
    tags: ["auth-username"],
  },
)

export const authUsernameOrRedirect = async (
  username: string,
  redirectTo: string,
) => {
  // Verify user is authenticated
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in")
  }

  const result = await authUsernameCached(userId, username)
  if (result === null) {
    redirect(redirectTo)
  }

  return result
}

export type BundleExtended = Bundle & {
  componentsIds: number[]
}

export const getCachedUserBundles = unstable_cache(
  async (userId: string): Promise<BundleExtended[]> => {
    const { data: bundles, error } = await supabaseWithAdminAccess
      .from("bundles")
      .select("*")
      .eq("user_id", userId)

    if (error) {
      console.error("Error fetching user bundles:", error)
      return []
    }

    const { data: bundleComponentsIds, error: bundleItemsError } =
      await supabaseWithAdminAccess
        .from("bundle_items")
        .select("*")
        .in(
          "bundle_id",
          bundles.map((bundle) => bundle.id),
        )

    if (bundleItemsError) {
      console.error("Error fetching bundle items:", bundleItemsError)
      return []
    }

    const bundlesExtended = bundles.map((bundle) => {
      const componentsIds = bundleComponentsIds
        .filter((item) => item.bundle_id === bundle.id)
        .map((item) => item.component_id)
      return {
        ...bundle,
        componentsIds,
      }
    })

    return bundlesExtended
  },
  ["user-bundles"],
  {
    revalidate: 30,
    tags: ["user-bundles"],
  },
)

// Get user data by username
export const getCachedUser = unstable_cache(
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
export const getCachedUserDemos = unstable_cache(
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
