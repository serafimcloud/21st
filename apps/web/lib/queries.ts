import { PurchaseComponentError } from "@/app/api/components/purchase/route"
import { makeSlugFromName } from "@/components/features/publish/hooks/use-is-check-slug-available"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { categories } from "@/lib/navigation"
import { transformDemoResult } from "@/lib/utils/transformData"
import {
  Component,
  Demo,
  DemoWithComponent,
  SortOption,
  Tag,
  User,
} from "@/types/global"
import {
  CreatePromptRuleInput,
  PromptRule,
  TechStack,
  Theme,
  UpdatePromptRuleInput,
} from "@/types/prompt-rules"
import { Database, Json } from "@/types/supabase"
import { useAuth, useUser } from "@clerk/nextjs"
import { SupabaseClient } from "@supabase/supabase-js"
import {
  UseMutationResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useCallback } from "react"

export const componentReadableDbFields = `
  *,
  user:users!user_id (*)
`

export const demoReadableDbFields = `
  *,
  component:components!component_id (*),
  user:components!component_id(users!user_id(*))
`

export async function getComponent(
  supabase: SupabaseClient<Database>,
  username: string,
  slug: string,
) {
  const { data, error } = await supabase
    .from("components")
    .select(
      `
      ${componentReadableDbFields},
      tags:component_tags(tags(name, slug))
    `,
    )
    .eq("component_slug", slug)
    .eq("user.username", username)
    .not("user", "is", null)
    .order("downloads_count", { ascending: false })
    .returns<(Component & { user: User } & { tags: Tag[] })[]>()
    .single()

  if (error) {
    console.error("Error fetching component:", error)
    return { data: null, error: new Error(error.message) }
  }

  if (data && data.tags) {
    data.tags = data.tags.map((tag: any) => tag.tags)
  }

  return { data, error }
}

export async function getUserData(
  supabase: SupabaseClient<Database>,
  username: string,
): Promise<{ data: User | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .or(`username.eq.${username},display_username.eq.${username}`)
      .single()

    if (error) {
      console.error("Error fetching user data:", error)
      return { data: null, error: new Error(error.message) }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("Error in getUserData:", error)
    return { data: null, error }
  }
}

export const authUsername = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  targetUsername: string,
): Promise<{ user: User; isAdmin: boolean; isOwnProfile: boolean } | null> => {
  // Get user data from Supabase
  const { data: user } = await getUserData(supabase, targetUsername)

  if (!user) {
    console.error("User not found")
    return null
  }

  // Verify user has access to this page (own profile or admin)
  const { data: currentUser, error: currentUserError } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .single()

  if (currentUserError) {
    console.error("Error fetching current user", currentUserError)
    return null
  }

  const isAdmin = currentUser?.is_admin || false
  const isOwnProfile = userId === user.id

  if (!isAdmin && !isOwnProfile) {
    return null
  }

  return { user, isAdmin, isOwnProfile }
}

export async function addTagsToDemo(
  supabase: SupabaseClient<Database>,
  demoId: number,
  tags: Tag[],
) {
  for (const tag of tags) {
    let tagId: number

    if (tag.id) {
      tagId = tag.id
    } else {
      const capitalizedName =
        tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
      const slug = makeSlugFromName(tag.name)
      const { data: existingTag, error: selectError } = await supabase
        .from("tags")
        .select("id")
        .eq("slug", slug)
        .single()

      if (existingTag) {
        tagId = existingTag.id
      } else {
        const { data: newTag, error: insertError } = await supabase
          .from("tags")
          .insert({ name: capitalizedName, slug })
          .select()
          .single()

        if (insertError) {
          console.error("Error inserting tag:", insertError)
          continue
        }
        if (newTag && typeof newTag === "object" && "id" in newTag) {
          tagId = (newTag as { id: number }).id
        } else {
          console.error("New tag was not created or does not have an id")
          continue
        }
      }
    }

    const { error: linkError } = await supabase
      .from("demo_tags")
      .insert({ demo_id: demoId, tag_id: tagId })

    if (linkError) {
      console.error("Error linking tag to demo:", linkError)
    }
  }
}

export function useAvailableTags() {
  async function getAvailableTags(
    supabase: SupabaseClient<Database>,
  ): Promise<Tag[]> {
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("name")

    if (error) {
      console.error("Error loading tags:", error)
      return []
    }

    return data || []
  }

  const supabase = useClerkSupabaseClient()

  return useQuery<Tag[], Error>({
    queryKey: ["availableTags"],
    queryFn: () => getAvailableTags(supabase),
  })
}

export async function updateComponentWithTags(
  supabase: SupabaseClient,
  componentId: number,
  updatedData: Partial<Component & { tags?: Tag[] }>,
) {
  const { name, description, license, preview_url, website_url, tags } =
    updatedData

  const tagsJson = tags
    ? tags.map((tag) => ({
        name: tag.name,
        slug: tag.slug,
      }))
    : null

  const { data, error } = await supabase.rpc("update_component_with_tags", {
    p_component_id: componentId,
    p_name: name !== undefined ? name : null,
    p_description: description !== undefined ? description : null,
    p_license: license !== undefined ? license : null,
    p_preview_url: preview_url !== undefined ? preview_url : null,
    p_website_url: website_url !== undefined ? website_url : null,
    p_tags: tagsJson,
  })

  if (error) {
    console.error("Error updating component with tags:", error)
    throw error
  }

  return data
}

export function useUpdateComponentWithTags(
  supabase: SupabaseClient,
): UseMutationResult<
  void,
  Error,
  { componentId: number; updatedData: Partial<Component & { tags?: Tag[] }> }
> {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    Error,
    { componentId: number; updatedData: Partial<Component & { tags?: Tag[] }> }
  >({
    mutationFn: async ({ componentId, updatedData }) => {
      await updateComponentWithTags(supabase, componentId, updatedData)
    },
    onSuccess: (_data, { componentId }) => {
      queryClient.invalidateQueries({ queryKey: ["component", componentId] })
      queryClient.invalidateQueries({ queryKey: ["components"] })
    },
  })
}

export async function getHunterUser(
  supabase: SupabaseClient<Database>,
  hunterUsername: string | null,
): Promise<User | null> {
  if (!hunterUsername) return null

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", hunterUsername)
    .single()

  if (error) {
    console.error("Error fetching hunter user:", error)
    return null
  }

  return data
}

export function useHunterUser(hunterUsername: string | null) {
  const supabase = useClerkSupabaseClient()
  return useQuery({
    queryKey: ["hunterUser", hunterUsername],
    queryFn: () => getHunterUser(supabase, hunterUsername),
    enabled: !!hunterUsername,
    staleTime: Infinity,
  })
}

export async function getComponentDemos(
  supabase: SupabaseClient<Database>,
  componentId: number,
) {
  const { data, error } = await supabase
    .from("demos")
    .select(
      `
      *,
      user:users!user_id (*),
      tags:demo_tags(
        tag:tag_id(*)
      ),
      component:components!component_id (
        *,
        user:users!user_id (*)
      )
    `,
    )
    .eq("component_id", componentId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching component demos:", error)
    return { data: null, error }
  }

  const transformedData = data?.map((demo: any) => ({
    ...demo,
    tags: demo.tags.map((tagRelation: any) => tagRelation.tag),
    component: {
      ...demo.component,
      user: demo.component.user,
    },
  }))

  return { data: transformedData, error: null }
}

export async function getComponentWithDemo(
  supabase: SupabaseClient<Database>,
  username: string,
  slug: string,
  demo_slug: string,
) {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .or(`username.eq.${username},display_username.eq.${username}`)
    .single()

  if (userError) {
    console.error("User error:", userError)
    return { data: null, error: new Error(userError.message) }
  }

  const { data: component, error: componentError } = await supabase
    .from("components")
    .select(
      `
      *,
      user:users!components_user_id_fkey(*),
      mv_component_analytics!component_analytics_component_id_fkey(
        activity_type,
        count
      ),
      tags:component_tags(
        tags:tags(*)
      )
    `,
    )
    .eq("component_slug", slug)
    .eq("user_id", user.id)
    .single()

  if (componentError) {
    console.error("Component error:", componentError)
    return { data: null, error: new Error(componentError.message) }
  }

  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .select("*")
    .eq("component_id", component.id)
    .maybeSingle()

  if (submissionError) {
    return { data: null, error: new Error(submissionError.message) }
  }

  const { data: demo, error: demoError } = await supabase
    .from("demos")
    .select(
      `
      *,
      demo_user:users!demos_user_id_fkey(*),
      tags:demo_tags(
        tags:tags(*)
      )
    `,
    )
    .eq("component_id", component.id)
    .eq("demo_slug", demo_slug)
    .single()

  if (demoError) {
    if (demo_slug === "default") {
      return { data: null, error: new Error(demoError.message) }
    }
    return { data: null, error: null, shouldRedirectToDefault: true }
  }

  const formattedDemo = {
    ...(demo as any),
    user: demo.demo_user,
    tags: demo.tags ? demo.tags.map((tag: any) => tag.tags) : [],
    component: {
      ...component,
      user: component.user,
    },
  } as unknown as Demo & { user: User } & { tags: Tag[] } & {
    component: Component & { user: User }
  }

  delete (formattedDemo as any).demo_user

  const formattedComponent = {
    ...component,
    tags: component.tags ? component.tags.map((tag: any) => tag.tags) : [],
  } as unknown as Component & { user: User } & { tags: Tag[] }

  return {
    data: {
      component: formattedComponent,
      demo: formattedDemo,
      submission,
    },
    error: null,
  }
}

export async function getUserDemos(
  supabase: SupabaseClient<Database>,
  userId: string,
  loggedInUserId?: string,
) {
  const { data, error } = await supabase.rpc("get_user_profile_demo_list", {
    p_user_id: userId,
    p_include_private: userId === loggedInUserId,
  })

  if (error) {
    console.error("Error fetching user demos:", error)
    return null
  }

  return data.map(transformDemoResult)
}

export async function getComponentWithDemoForOG(
  supabase: SupabaseClient<Database>,
  username: string,
  slug: string,
  demo_slug: string,
) {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .or(`username.eq.${username},display_username.eq.${username}`)
    .single()

  if (userError) {
    console.error("User error:", userError)
    return { data: null, error: new Error(userError.message) }
  }

  const { data: component, error: componentError } = await supabase
    .from("components")
    .select(
      `
      *,
      user:users!components_user_id_fkey(*),
      mv_component_analytics!component_analytics_component_id_fkey(
        activity_type,
        count
      ),
      tags:component_tags(
        tags:tags(*)
      )
    `,
    )
    .eq("component_slug", slug)
    .eq("user_id", user.id)
    .single()

  if (componentError) {
    console.error("Component error:", componentError)
    return { data: null, error: new Error(componentError.message) }
  }

  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .select("*")
    .eq("component_id", component.id)
    .maybeSingle()

  if (submissionError) {
    return { data: null, error: new Error(submissionError.message) }
  }

  const { data: demo, error: demoError } = await supabase
    .from("demos")
    .select(
      `
      *,
      demo_user:users!demos_user_id_fkey(*),
      tags:demo_tags(
        tags:tags(*)
      )
    `,
    )
    .eq("component_id", component.id)
    .eq("demo_slug", demo_slug)
    .single()

  if (demoError) {
    if (demo_slug === "default") {
      return { data: null, error: new Error(demoError.message) }
    }
    return { data: null, error: null, shouldRedirectToDefault: true }
  }

  const formattedDemo = {
    ...(demo as any),
    user: demo.demo_user,
    tags: demo.tags ? demo.tags.map((tag: any) => tag.tags) : [],
    component: {
      ...component,
      user: component.user,
    },
  } as unknown as Demo & { user: User } & { tags: Tag[] } & {
    component: Component & { user: User }
  }

  delete (formattedDemo as any).demo_user

  const formattedComponent = {
    ...component,
    tags: component.tags ? component.tags.map((tag: any) => tag.tags) : [],
  } as unknown as Component & { user: User } & { tags: Tag[] }

  return {
    data: {
      component: formattedComponent,
      demo: formattedDemo,
      submission,
    },
    error: null,
  }
}

export async function getUserLikedComponents(
  supabase: SupabaseClient<Database>,
  userId: string,
  loggedInUserId?: string,
) {
  const { data, error } = await supabase.rpc("get_user_bookmarks_list", {
    p_user_id: userId,
    p_include_private: userId === loggedInUserId,
  })

  if (error) {
    console.error("Error fetching user liked components:", error)
    return null
  }

  return data.map(transformDemoResult)
}

export async function getUserComponentsCounts(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase.rpc("get_user_components_counts", {
    p_user_id: userId,
  })

  if (error) {
    console.error("Error fetching user components counts:", error)
    return null
  }

  return data
}

export async function bookmarkDemo(
  supabase: SupabaseClient<Database>,
  userId: string,
  demoId: number,
) {
  const { error } = await supabase.from("demo_bookmarks").insert({
    user_id: userId,
    demo_id: demoId,
  })

  if (error) {
    console.error("Error bookmarking demo:", error)
    throw error
  }
}

export async function unbookmarkDemo(
  supabase: SupabaseClient<Database>,
  userId: string,
  demoId: number,
) {
  const { error } = await supabase
    .from("demo_bookmarks")
    .delete()
    .eq("user_id", userId)
    .eq("demo_id", demoId)

  if (error) {
    console.error("Error removing demo bookmark:", error)
    throw error
  }
}

export function useBookmarkMutation(
  supabase: SupabaseClient<Database>,
  userId: string | undefined,
): UseMutationResult<void, Error, { demoId: number; bookmarked: boolean }> {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { demoId: number; bookmarked: boolean }>({
    mutationFn: async ({
      demoId,
      bookmarked,
    }: {
      demoId: number
      bookmarked: boolean
    }) => {
      if (!userId) {
        throw new Error("User is not logged in")
      }
      if (bookmarked) {
        await unbookmarkDemo(supabase, userId, demoId)
      } else {
        await bookmarkDemo(supabase, userId, demoId)
      }
    },
    onSuccess: (_, { demoId }) => {
      queryClient.invalidateQueries({
        queryKey: ["hasUserBookmarkedDemo", demoId, userId],
      })
      queryClient.invalidateQueries({
        queryKey: ["demo", demoId],
      })
      queryClient.invalidateQueries({
        queryKey: ["demos"],
      })
    },
  })
}

export function useHasUserBookmarkedDemo(
  supabase: SupabaseClient<Database>,
  demoId: number | undefined,
  userId: string | undefined,
) {
  return useQuery({
    queryKey: ["hasUserBookmarkedDemo", demoId, userId],
    queryFn: async () => {
      if (!demoId || !userId) return false

      const { data, error } = await supabase
        .from("demo_bookmarks")
        .select("*")
        .eq("demo_id", demoId)
        .eq("user_id", userId)
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error checking if user bookmarked demo:", error)
      }

      return !!data
    },
    enabled: !!demoId && !!userId,
  })
}

// Prompt Rules functions
export async function getPromptRules(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<PromptRule[]> {
  const { data, error } = await supabase
    .from("prompt_rules")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching prompt rules:", error)
    throw new Error(`Failed to fetch prompt rules: ${error.message}`)
  }

  // Transform the data to match the PromptRule type
  return data.map((item) => ({
    ...item,
    tech_stack: (item.tech_stack as unknown as TechStack[]) || [],
    theme: (item.theme as unknown as Theme) || {},
    created_at: item.created_at || new Date().toISOString(), // Ensure created_at is never null
    updated_at: item.updated_at || item.created_at || new Date().toISOString(), // Ensure updated_at is never null
  }))
}

export async function getPromptRule(
  supabase: SupabaseClient<Database>,
  id: number,
): Promise<PromptRule | null> {
  const { data, error } = await supabase
    .from("prompt_rules")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    console.error("Error fetching prompt rule:", error)
    throw new Error(`Failed to fetch prompt rule: ${error.message}`)
  }

  // Transform the data to match the PromptRule type
  return {
    ...data,
    tech_stack: (data.tech_stack as unknown as TechStack[]) || [],
    theme: (data.theme as unknown as Theme) || {},
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || data.created_at || new Date().toISOString(),
  }
}

export async function createPromptRule(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreatePromptRuleInput,
): Promise<PromptRule> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from("prompt_rules")
    .insert({
      user_id: userId,
      name: input.name,
      tech_stack: input.tech_stack as unknown as Json,
      theme: input.theme as unknown as Json,
      additional_context: input.additional_context || null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating prompt rule:", error)
    throw new Error(`Failed to create prompt rule: ${error.message}`)
  }

  // Transform the data to match the PromptRule type
  return {
    ...data,
    tech_stack: (data.tech_stack as unknown as TechStack[]) || [],
    theme: (data.theme as unknown as Theme) || {},
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
  }
}

export async function updatePromptRule(
  supabase: SupabaseClient<Database>,
  id: number,
  input: UpdatePromptRuleInput,
): Promise<PromptRule> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from("prompt_rules")
    .update({
      name: input.name,
      tech_stack: input.tech_stack as unknown as Json,
      theme: input.theme as unknown as Json,
      additional_context: input.additional_context,
      updated_at: now,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating prompt rule:", error)
    throw new Error(`Failed to update prompt rule: ${error.message}`)
  }

  // Transform the data to match the PromptRule type
  return {
    ...data,
    tech_stack: (data.tech_stack as unknown as TechStack[]) || [],
    theme: (data.theme as unknown as Theme) || {},
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
  }
}

export async function deletePromptRule(
  supabase: SupabaseClient<Database>,
  id: number,
): Promise<void> {
  const { error } = await supabase.from("prompt_rules").delete().eq("id", id)

  if (error) {
    console.error("Error deleting prompt rule:", error)
    throw new Error(`Failed to delete prompt rule: ${error.message}`)
  }
}

// Hook for prompt rules
export function usePromptRules() {
  const supabase = useClerkSupabaseClient()
  const { user } = useUser()

  return useQuery<PromptRule[]>({
    queryKey: ["prompt-rules"],
    queryFn: async () => {
      if (!user?.id) return []
      return getPromptRules(supabase, user.id)
    },
    enabled: !!user?.id,
  })
}

export function usePromptRule(id: number | undefined) {
  const supabase = useClerkSupabaseClient()

  return useQuery<PromptRule | null>({
    queryKey: ["prompt-rule", id],
    queryFn: async () => {
      if (!id) return null
      return getPromptRule(supabase, id)
    },
    enabled: !!id,
  })
}

export function usePurchaseComponent(): UseMutationResult<
  { success: true } | { success: false; error: PurchaseComponentError },
  Error,
  { componentId: number }
> {
  const queryClient = useQueryClient()
  const { userId } = useAuth()

  return useMutation({
    mutationFn: async ({ componentId }) => {
      const response = await fetch("/api/components/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ componentId }),
      })

      if (!response.ok) {
        throw new Error("Failed to purchase component")
      }

      return response.json()
    },
    onSuccess: (_, { componentId }) => {
      // Invalidate component purchase status
      queryClient.invalidateQueries({
        queryKey: ["component-purchase", componentId, userId],
      })

      // Invalidate user state (balance, etc)
      queryClient.invalidateQueries({
        queryKey: ["user", userId, "state"],
      })

      // Invalidate user components list
      queryClient.invalidateQueries({
        queryKey: ["userComponents"],
      })
    },
  })
}

// Hook for featured, popular and latest demos
export function useFeaturedDemos() {
  const supabase = useClerkSupabaseClient()
  const adminUserIds = [
    "user_2nA0HITg0H7hvozIDNdxvzinpei",
    "user_2nElBLvklOKlAURm6W1PTu6yYFh",
  ]
  const adminLikedItemsLimit = 24 // Fetch more items for the slider

  return useQuery({
    queryKey: ["featured-demos"] as const,
    queryFn: async () => {
      // Fetch liked demos for all admin users
      const likedResults = await Promise.all(
        adminUserIds.map((userId) =>
          supabase.rpc("get_admin_liked_demos_v1", {
            p_user_id: userId,
            p_limit: adminLikedItemsLimit,
          }),
        ),
      )

      // Process Liked Demos
      let combinedLikedDemosRaw: AdminLikedDemo[] = []
      likedResults.forEach((result) => {
        if (result.error) {
          console.error(
            `Error fetching admin liked demos for one user:`,
            result.error,
          )
        } else if (result.data) {
          combinedLikedDemosRaw = combinedLikedDemosRaw.concat(
            result.data as AdminLikedDemo[],
          )
        }
      })

      // Deduplicate liked demos using a Map, preserving first occurrence
      const uniqueLikedDemosMap = new Map<number, AdminLikedDemo>()
      combinedLikedDemosRaw.forEach((demo) => {
        // Ensure demo and demo.id are valid before using the map
        if (
          demo &&
          typeof demo.id === "number" &&
          !uniqueLikedDemosMap.has(demo.id)
        ) {
          uniqueLikedDemosMap.set(demo.id, demo)
        }
      })

      // Transform and Sort unique liked demos by updated_at desc as proxy for bookmarked_at
      const uniqueLikedDemosTransformed = Array.from(
        uniqueLikedDemosMap.values(),
      )
        .map(transformDemoResult) // Transform first
        .sort((a, b) => {
          // Then sort
          // Handle potential null or undefined dates gracefully
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0
          return dateB - dateA // Descending order
        })

      // Shuffle the featured items to add variety each time
      const shuffledFeaturedItems = [...uniqueLikedDemosTransformed]
      for (let i = shuffledFeaturedItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = shuffledFeaturedItems[i]
        shuffledFeaturedItems[i] = shuffledFeaturedItems[j] as DemoWithComponent
        shuffledFeaturedItems[j] = temp as DemoWithComponent
      }

      return {
        data: shuffledFeaturedItems as DemoWithComponent[],
        ids: new Set(uniqueLikedDemosTransformed.map((d) => d.id)),
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })
}

// Hook to get popular demos - independent of featured demos
export function useMainDemosExcludingFeatured() {
  const supabase = useClerkSupabaseClient()

  return useQuery({
    queryKey: ["popular-demos"] as const,
    queryFn: async () => {
      const { data: filteredData, error } = await supabase.rpc(
        "get_demos_list_v2",
        {
          p_sort_by: "downloads",
          p_offset: 0,
          p_limit: 24,
          p_tag_slug: undefined,
          p_include_private: false,
        },
      )

      if (error) {
        console.error("Error fetching popular demos:", error)
        throw error
      }

      const transformedData = (filteredData || []).map(transformDemoResult)
      return transformedData as DemoWithComponent[]
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })
}

// Hook to get latest demos
export function useLatestDemos() {
  const supabase = useClerkSupabaseClient()

  return useQuery({
    queryKey: ["latest-demos"] as const,
    queryFn: async () => {
      const { data: filteredData, error } = await supabase.rpc(
        "get_demos_list_v2",
        {
          p_sort_by: "date",
          p_offset: 0,
          p_limit: 24,
          p_tag_slug: undefined,
          p_include_private: false,
        },
      )

      if (error) {
        console.error("Error fetching latest demos:", error)
        throw error
      }

      const transformedData = (filteredData || []).map(transformDemoResult)
      return transformedData
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })
}

// Define type for admin liked demo
type AdminLikedDemo =
  Database["public"]["Functions"]["get_admin_liked_demos_v1"]["Returns"][number]

// Hook to get demos by tag
export function useTagDemos(
  tagSlug: string,
  sortBy: SortOption,
  initialData?: DemoWithComponent[],
  limit: number = 1000,
) {
  const supabase = useClerkSupabaseClient()
  return useQuery({
    queryKey: ["tag-filtered-demos", tagSlug, sortBy, limit] as const,
    queryFn: async () => {
      const { data: filteredData, error } = await supabase.rpc(
        "get_demos_list_v2",
        {
          p_sort_by: sortBy,
          p_offset: 0,
          p_limit: limit,
          p_tag_slug: tagSlug,
          p_include_private: false,
        },
      )

      if (error) throw error
      const transformedData = (filteredData || []).map(transformDemoResult)
      return {
        data: transformedData,
        total_count: filteredData?.[0]?.total_count ?? 0,
      }
    },
    initialData: initialData
      ? {
          data: initialData as DemoWithComponent[],
          total_count: initialData.length,
        }
      : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })
}

// Function to get demos count from navigation data
export function getTagDemosCount(tagSlug: string): number {
  const allItems = categories.flatMap((category) => category.items)
  const item = allItems.find((item) => item.href === `/s/${tagSlug}`)
  return item?.demosCount ?? 0
}

// ─────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────
export type Round = {
  id: number
  week_number: number
  start_at: string
  end_at: string
  seasonal_tag_id: number | null
  created_at: string
}

export type Submission = {
  component_id: number
  name: string
  preview_url: string | null
  description: string | null
  category: string
  final_score: number
  rank: number
  has_voted?: boolean
  votes_count?: number
}

// ─────────────────────────────────────────────────────────────────────────
//  ROUNDS
// ─────────────────────────────────────────────────────────────────────────
export async function getContestRounds(supabase: SupabaseClient<Database>) {
  console.log("[getContestRounds] Fetching contest rounds...")
  const { data, error } = await supabase
    .from("component_hunt_rounds")
    .select("*")
    .order("start_at", { ascending: false })

  if (error) {
    console.error("[getContestRounds] Error:", error)
    throw error
  }
  console.log("[getContestRounds] Found", data?.length, "rounds")
  return data as Round[]
}

// ─────────────────────────────────────────────────────────────────────────
//  VOTING
// ─────────────────────────────────────────────────────────────────────────
export function useToggleVote(roundId: number | null) {
  const supabase = useClerkSupabaseClient()
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({ demoId }: { demoId: number }) => {
      if (!roundId) throw new Error("No round selected")
      if (!user) throw new Error("Must be logged in to vote")

      const { data, error } = await supabase.rpc("hunt_toggle_demo_vote", {
        p_round_id: roundId,
        p_demo_id: demoId,
      })

      if (error) throw error

      return data as boolean // true if vote was added, false if removed
    },
    onSuccess: (added, { demoId }) => {
      // Show success toast using sonner
      import("sonner").then(({ toast }) => {
        toast.success(added ? "Upvoted!" : "Vote removed")
      })

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({
        queryKey: ["demo-hunt-submissions", roundId],
      })
    },
    onError: (error) => {
      // Show error toast using sonner
      import("sonner").then(({ toast }) => {
        toast.error(error.message)
      })
    },
  })
}

export type DemoHuntLeaderboardRow = {
  id: number
  name: string
  final_score: number | null
  global_rank: number | null
  votes: number | null
  installs: number | null
  view_count: number | null
  bookmarks_count: number | null
  has_voted: boolean
  user_data: {
    username: string
    display_image_url: string | null
  }
  component_data: {
    name: string
  }
  tags: {
    slug: string
  }[]
}
type DemoHuntCategoryLeaderboardRow =
  Database["public"]["Views"]["demo_hunt_leaderboard"]["Row"]

export async function getRoundSubmissions(
  supabase: SupabaseClient<Database>,
  roundId: number,
) {
  const { data, error } = await supabase
    .from("demo_hunt_leaderboard")
    .select("*")
    .eq("round_id", roundId)
    .returns<DemoHuntCategoryLeaderboardRow[]>()

  if (error) throw error

  console.log(
    "Raw data from DB:",
    data?.map((d) => ({ id: d.id, tags: d.tags })),
  )

  return (data || []).map(
    (row: DemoHuntCategoryLeaderboardRow): DemoHuntLeaderboardRow => {
      const rawTags = (row.tags as any) || []
      const normalizedTags = Array.isArray(rawTags)
        ? rawTags.map((tag: any) => ({
            slug: (typeof tag === "string"
              ? tag
              : tag.slug || ""
            ).toLowerCase(),
          }))
        : []

      console.log(`Row ${row.id} normalized tags:`, normalizedTags)

      return {
        id: row.id!,
        name: row.demo_slug || "",
        final_score: row.final_score,
        global_rank: row.global_rank,
        votes: row.votes,
        installs: row.installs,
        view_count: row.view_count,
        bookmarks_count: row.bookmarks_count,
        has_voted: row.has_voted || false,
        user_data: {
          username: (row.component_user_data as any)?.username || "",
          display_image_url:
            (row.component_user_data as any)?.display_image_url || null,
        },
        component_data: {
          name: (row.component_data as any)?.name || "",
        },
        tags: normalizedTags,
      }
    },
  )
}

export async function getHuntDemosList(
  supabase: SupabaseClient<Database>,
  roundId: number,
) {
  const { data, error } = await supabase.rpc("get_hunt_demos_list_v2", {
    p_round_id: roundId,
  })

  if (error) {
    console.error("Error fetching hunt demos:", error)
    throw error
  }

  return data
}

export const useRoundSubmissions = (roundId: number | null) => {
  const supabase = useClerkSupabaseClient()
  const { user } = useUser()

  const {
    data: submissions,
    isLoading,
    error,
    ...rest
  } = useQuery({
    queryKey: ["demo-hunt-submissions", roundId, user?.id],
    queryFn: async () => {
      if (!roundId) return []

      const data = await getHuntDemosList(supabase, roundId)

      return (data || []).map((submission: any) => {
        const componentData =
          typeof submission.component_data === "object"
            ? submission.component_data || {}
            : {}

        const result = submission as any

        result.component = {
          id: componentData.id || 0,
          name: componentData.name || "",
          component_slug: componentData.component_slug || "",
          user_id: componentData.user_id || "",
          is_public: !!componentData.is_public,
          user: result.component_user_data || {},
          downloads_count: componentData.downloads_count || 0,
          likes_count: componentData.likes_count || 0,
          license: componentData.license || null,
          registry: componentData.registry || null,
        }

        return result
      })
    },
    enabled: !!roundId,
  })

  // Get the current round to check the seasonal tag
  const { data: roundData } = useQuery({
    queryKey: ["demo-hunt-seasonal-tag", roundId],
    queryFn: async () => {
      if (!roundId) return null

      const { data, error } = await supabase
        .from("component_hunt_rounds")
        .select("*,tags!component_hunt_rounds_seasonal_tag_id_fkey(slug,name)")
        .eq("id", roundId as number)
        .single()

      if (error) {
        console.error("Error fetching seasonal tag:", error)
        return null
      }

      return data
    },
    enabled: !!roundId,
  })

  const seasonalTagSlug = roundData?.tags?.slug?.toLowerCase() || ""

  const uiSlugs = [
    "accordion",
    "ai-chat",
    "alert",
    "avatar",
    "badge",
    "button",
    "calendar",
    "card",
    "carousel",
    "checkbox",
    "date-picker",
    "modal-dialog",
    "dropdown",
    "empty-state",
    "file-tree",
    "upload-download",
    "form",
    "icons",
    "input",
    "link",
    "menu",
    "notification",
    "number",
    "pagination",
    "popover",
    "radio-group",
    "sidebar",
    "sign-in",
    "registration-signup",
    "select",
    "slider",
    "spinner-loader",
    "table",
    "chip-tag",
    "tabs",
    "textarea",
    "toast",
    "toggle",
    "tooltip",
  ]
  const marketingSlugs = [
    "announcement",
    "background",
    "border",
    "call-to-action",
    "clients",
    "comparison",
    "dock",
    "features",
    "footer",
    "hero",
    "hook",
    "image",
    "map",
    "navbar-navigation",
    "pricing-section",
    "scroll-area",
    "testimonials",
    "text",
    "video",
  ]

  const getFilteredSubmissions = useCallback(
    (category: string) => {
      if (!submissions) return []
      if (category === "global") return submissions

      return submissions.filter((submission: any) => {
        const submissionTags = Array.isArray(submission.tags)
          ? submission.tags
          : []
        const submissionSlugs = submissionTags.map((tag: any) => {
          return typeof tag === "string" ? tag : tag?.slug || ""
        })

        if (category === "ui") {
          return submissionSlugs.some((slug: string) => uiSlugs.includes(slug))
        } else if (category === "marketing") {
          return submissionSlugs.some((slug: string) =>
            marketingSlugs.includes(slug),
          )
        } else if (category === "seasonal" && seasonalTagSlug) {
          return submissionSlugs.some(
            (slug: string) => slug.toLowerCase() === seasonalTagSlug,
          )
        }
        return false
      })
    },
    [submissions, seasonalTagSlug],
  )

  return {
    submissions,
    getFilteredSubmissions,
    isLoading,
    error,
    ...rest,
  }
}

export function useContestRounds() {
  const supabase = useClerkSupabaseClient()
  return useQuery({
    queryKey: ["demo-hunt-rounds"],
    queryFn: () => getContestRounds(supabase),
  })
}

export function useLeaderboardDemosForHome() {
  const supabase = useClerkSupabaseClient()
  const { user } = useUser()

  // First get the current active round or most recent past round
  const roundQuery = useQuery({
    queryKey: ["current-hunt-round"],
    queryFn: async () => {
      const now = new Date().toISOString()

      // First try to get active round
      const { data: activeRound } = await supabase
        .from("component_hunt_rounds")
        .select("*")
        .lte("start_at", now)
        .gte("end_at", now)
        .single()

      if (activeRound) {
        return activeRound as Round
      }

      // If no active round, get the most recent past round
      const { data: pastRound } = await supabase
        .from("component_hunt_rounds")
        .select("*")
        .lte("start_at", now)
        .order("start_at", { ascending: false })
        .limit(1)
        .single()

      return pastRound as Round
    },
  })

  // When we have the round, fetch the submissions
  const { data, isLoading, error } = useQuery({
    queryKey: ["leaderboard-demos-home", roundQuery.data?.id, user?.id],
    queryFn: async () => {
      if (!roundQuery.data?.id) return []

      // Get data using the same function as the leaderboard
      const data = await getHuntDemosList(supabase, roundQuery.data.id)

      // First, ensure we have consistent sorting by rank or votes, exactly as in the global leaderboard
      // Use the same sort order: global_rank first (if available), then votes, then view_count
      const sortedData = [...(data || [])].sort((a: any, b: any) => {
        // First, try to sort by global_rank if available (and valid)
        if (a.global_rank && b.global_rank && a.global_rank !== b.global_rank) {
          return (a.global_rank || Infinity) - (b.global_rank || Infinity)
        }

        // If ranks are equal or not available, sort by votes
        if ((a.votes || 0) !== (b.votes || 0)) {
          return (b.votes || 0) - (a.votes || 0)
        }

        // If votes are equal, sort by view count
        if ((a.view_count || 0) !== (b.view_count || 0)) {
          return (b.view_count || 0) - (a.view_count || 0)
        }

        // Last resort, sort by ID
        return a.id - b.id
      })

      // Return all items, not just the top 10
      return sortedData.map((submission: any, index: number) => {
        // Create a transformed version that matches DemoWithComponent format
        const componentData =
          typeof submission.component_data === "object"
            ? submission.component_data || {}
            : {}

        // Create a partial transformation with required fields
        const transformedDemo = {
          id: submission.id,
          name: submission.demo_slug || submission.name || "",
          demo_slug: submission.demo_slug || "default",
          description: componentData.description || "",
          preview_url: submission.preview_url || null,
          created_at: submission.created_at || new Date().toISOString(),
          updated_at: submission.updated_at || new Date().toISOString(),
          component_id: componentData.id || null,
          downloads_count: componentData.downloads_count || 0,
          likes_count: componentData.likes_count || 0,
          bookmarks_count: submission.bookmarks_count || 0,
          view_count: submission.view_count || 0,
          votes_count: submission.votes || 0,
          has_voted: submission.has_voted || false,
          bundle_url: submission.bundle_url || null,
          global_rank: submission.global_rank || null,
          compiled_css: null,
          compiled_js: null,
          video_url: submission.video_url || null,
          user: {
            id: submission.user_data?.id || "",
            username: submission.user_data?.username || "",
            display_username: submission.user_data?.username || "",
            display_image_url: submission.user_data?.display_image_url || null,
            display_name: submission.user_data?.username || "",
          },
          component: {
            id: componentData.id || 0,
            name: componentData.name || submission.name || "",
            component_slug: componentData.component_slug || "",
            user_id: componentData.user_id || "",
            is_public: true,
            user: {
              id: submission.user_data?.id || "",
              username: submission.user_data?.username || "",
              display_username: submission.user_data?.username || "",
              display_image_url:
                submission.user_data?.display_image_url || null,
              display_name: submission.user_data?.username || "",
            },
          },
        }

        return transformedDemo as unknown as DemoWithComponent
      })
    },
    enabled: !!roundQuery.data?.id,
  })

  return {
    data,
    isLoading: isLoading || roundQuery.isLoading,
    error,
    roundId: roundQuery.data?.id,
    weekNumber: roundQuery.data?.week_number,
  }
}

export function usePreviousRoundsSubmissions(limit: number = 3) {
  const supabase = useClerkSupabaseClient()
  const { user } = useUser()

  return useQuery({
    queryKey: ["previous-rounds-submissions", limit, user?.id],
    queryFn: async () => {
      // Get previous rounds sorted by start date (descending)
      const { data: rounds, error: roundsError } = await supabase
        .from("component_hunt_rounds")
        .select("*")
        .order("start_at", { ascending: false })
        .limit(limit + 1) // +1 to check if current round is included

      if (roundsError) throw roundsError

      if (!rounds || rounds.length === 0) {
        return []
      }

      // Skip the current round if it's included
      const now = new Date().toISOString()
      const previousRounds = rounds
        .filter((round) => new Date(round.end_at) < new Date(now))
        .slice(0, limit)

      if (previousRounds.length === 0) {
        return []
      }

      // Get seasonal tags for these rounds
      const seasonalTagIds = previousRounds
        .map((round) => round.seasonal_tag_id)
        .filter((id) => id !== null) as number[]

      const { data: seasonalTags, error: tagsError } = await supabase
        .from("tags")
        .select("id,name,slug")
        .in("id", seasonalTagIds)

      if (tagsError) throw tagsError

      // For each round, get the top submissions
      const result = await Promise.all(
        previousRounds.map(async (round) => {
          const data = await getHuntDemosList(supabase, round.id)

          // Get the seasonal tag for this round
          const seasonalTag =
            seasonalTags?.find((tag) => tag.id === round.seasonal_tag_id) ||
            null

          // First week was special with marketing, ui and seasonal categories
          const isFirstWeek = round.week_number === 1

          return {
            round,
            seasonalTag,
            isFirstWeek,
            submissions: data || [],
          }
        }),
      )

      return result
    },
  })
}
