import React from "react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import {
  ComponentCard,
  ComponentCardSkeleton,
} from "@/components/features/list-card/card"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { User } from "@/types/global"

interface OptimizedComponent {
  id: string
  name: string
  component_slug: string
  likes_count: number
  view_count: number
  user: User
}

interface OptimizedDemo {
  id: string
  name: string
  demo_slug: string
  preview_url: string | null
  video_url: string | null
  updated_at: string
  user: User
  component: OptimizedComponent
}

type UserTab = "published" | "hunted" | "demos" | "liked"

interface UserItemsListProps {
  className?: string
  skeletonCount?: number
  userId: string
  tab: UserTab
  initialData?: OptimizedDemo[]
}

function transformDemoData(data: any): OptimizedDemo {
  return {
    id: data.id.toString(),
    name: data.name,
    demo_slug: data.demo_slug,
    preview_url: data.preview_url,
    video_url: data.video_url,
    updated_at: data.updated_at,
    user: data.user_data,
    component: {
      id: data.component_data.id.toString(),
      name: data.component_data.name,
      component_slug: data.component_data.component_slug,
      likes_count: data.component_data.likes_count,
      view_count: data.component_data.view_count,
      user: data.component_user_data,
    },
  }
}

function useUserPublishedDemos(userId: string, initialData?: OptimizedDemo[]) {
  const supabase = useClerkSupabaseClient()
  return useQuery({
    queryKey: ["user-published-demos", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_profile_demos", {
        p_user_id: userId,
        p_include_private: false,
      })
      if (error) throw error
      return data.map(transformDemoData)
    },
    initialData,
    staleTime: 30 * 1000,
  })
}

function useUserHuntedComponents(
  userId: string,
  initialData?: OptimizedDemo[],
) {
  const supabase = useClerkSupabaseClient()
  return useQuery({
    queryKey: ["user-hunted-components", userId] as const,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_hunted_components", {
        p_hunter_username: userId,
      })
      if (error) throw error
      return (data || []).map(transformDemoData)
    },
    initialData,
  })
}

function useUserLikedComponents(userId: string, initialData?: OptimizedDemo[]) {
  const supabase = useClerkSupabaseClient()
  return useQuery({
    queryKey: ["user-liked-components", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_liked_components", {
        p_user_id: userId,
        p_include_private: false,
      })
      if (error) throw error
      return data.map(transformDemoData)
    },
    initialData,
    staleTime: 30 * 1000,
  })
}

function useUserDemos(userId: string, initialData?: OptimizedDemo[]) {
  const supabase = useClerkSupabaseClient()
  return useQuery({
    queryKey: ["user-demos", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_profile_demos", {
        p_user_id: userId,
        p_include_private: false,
      })
      if (error) throw error
      return data.map(transformDemoData)
    },
    initialData,
    staleTime: 30 * 1000,
  })
}

export function UserItemsList({
  className,
  skeletonCount = 12,
  userId,
  tab,
  initialData,
}: UserItemsListProps) {
  const publishedQuery = useUserPublishedDemos(
    tab === "published" ? userId : "",
    tab === "published" ? initialData : undefined,
  )

  const huntedQuery = useUserHuntedComponents(
    tab === "hunted" ? userId : "",
    tab === "hunted" ? initialData : undefined,
  )

  const likedQuery = useUserLikedComponents(
    tab === "liked" ? userId : "",
    tab === "liked" ? initialData : undefined,
  )

  const demosQuery = useUserDemos(
    tab === "demos" ? userId : "",
    tab === "demos" ? initialData : undefined,
  )

  const components = React.useMemo(() => {
    const allDemos =
      (() => {
        switch (tab) {
          case "published":
            return publishedQuery.data
          case "hunted":
            return huntedQuery.data
          case "demos":
            return demosQuery.data
          case "liked":
            return likedQuery.data
          default:
            return []
        }
      })() || []

    let filtered = allDemos

    if (tab === "published") {
      filtered = allDemos.filter((demo) => {
        const componentCreatorId = demo.component?.user?.id
        return componentCreatorId === userId
      })
    } else if (tab === "demos") {
      filtered = allDemos.filter((demo) => {
        return demo.user?.id === userId && demo.component?.user?.id !== userId
      })
    }

    return filtered
  }, [
    tab,
    publishedQuery.data,
    huntedQuery.data,
    demosQuery.data,
    likedQuery.data,
    userId,
  ])

  const isLoading = React.useMemo(() => {
    switch (tab) {
      case "published":
        return publishedQuery.isLoading
      case "hunted":
        return huntedQuery.isLoading
      case "demos":
        return demosQuery.isLoading
      case "liked":
        return likedQuery.isLoading
      default:
        return false
    }
  }, [
    tab,
    publishedQuery.isLoading,
    huntedQuery.isLoading,
    demosQuery.isLoading,
    likedQuery.isLoading,
  ])

  const showSkeleton = isLoading || !components?.length

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 list-none pb-10",
        className,
      )}
    >
      {showSkeleton ? (
        <>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <ComponentCardSkeleton key={i} />
          ))}
        </>
      ) : (
        components?.map((component: OptimizedDemo) => (
          <ComponentCard
            key={`${component.id}-${component.updated_at}`}
            component={component}
          />
        ))
      )}
    </div>
  )
}
