import { Component, Demo, Tag, User } from "@/types/global"
import {
  UseMutationResult,
  useMutation,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query"
import { makeSlugFromName } from "@/components/features/publish/hooks/use-is-check-slug-available"
import { SupabaseClient, createClient } from "@supabase/supabase-js"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useUser } from "@clerk/nextjs"
import { Database } from "@/types/supabase"
import { transformDemoResult } from "@/lib/utils/transformData"
import {
  PromptRule,
  CreatePromptRuleInput,
  UpdatePromptRuleInput,
  TechStack,
  Theme,
} from "@/types/prompt-rules"
import { Json } from "@/types/supabase"
import { PurchaseComponentError } from "@/app/api/components/purchase/route"
import { useAuth } from "@clerk/nextjs"

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

  // Transform the data to match DemoWithTags type
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
  // First get the user
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .or(`username.eq.${username},display_username.eq.${username}`)
    .single()

  if (userError) {
    console.error("User error:", userError)
    return { data: null, error: new Error(userError.message) }
  }

  // Then get the component for this user
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
  // First get the user
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .or(`username.eq.${username},display_username.eq.${username}`)
    .single()

  if (userError) {
    console.error("User error:", userError)
    return { data: null, error: new Error(userError.message) }
  }

  // Then get the component for this user
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

export async function hasUserPurchasedComponent(
  supabase: SupabaseClient,
  userId: string | null,
  componentId: string,
) {
  if (!userId) return false

  const { data } = await supabase
    .from("components_purchases")
    .select("*")
    .eq("user_id", userId)
    .eq("component_id", componentId)
    .single()

  return !!data
}
