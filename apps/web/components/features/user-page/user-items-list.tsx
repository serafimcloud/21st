import React from "react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import {
  ComponentCard,
} from "@/components/features/list-card/card"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { User } from "@/types/global"
import { useAtom } from "jotai"
import { userPageSearchAtom } from "./user-page-header"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useRouter } from "next/navigation"
import { isMac } from "@/lib/utils"
import { useHotkeys } from "react-hotkeys-hook"
import { ComponentCardSkeleton } from "@/components/ui/skeletons"
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

function filterComponentsBySearch(
  components: OptimizedDemo[] | undefined,
  searchQuery: string,
) {
  if (!components || !searchQuery) return components
  const query = searchQuery.toLowerCase()

  return components.filter((component) => {
    if (component.name?.toLowerCase().includes(query)) return true
    if (component.component?.name?.toLowerCase().includes(query)) return true
    if (component.user?.name?.toLowerCase().includes(query)) return true
    if (component.preview_url?.toLowerCase().includes(query)) return true
    return false
  })
}

export function UserItemsList({
  className,
  skeletonCount = 12,
  userId,
  tab,
  initialData,
}: UserItemsListProps) {
  const [searchQuery, setSearchQuery] = useAtom(userPageSearchAtom)
  const router = useRouter()

  React.useEffect(() => {
    return () => {
      setSearchQuery("")
    }
  }, [setSearchQuery])

  useHotkeys(
    "mod+enter",
    (e) => {
      e.preventDefault()
      handleGlobalSearch()
    },
    {
      enableOnFormTags: true,
      preventDefault: true,
    },
    [searchQuery],
  )

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

    let filtered = filterComponentsBySearch(allDemos, searchQuery) || []

    if (tab === "published") {
      filtered = filtered.filter((demo) => {
        const componentCreatorId = demo.component?.user?.id
        return componentCreatorId === userId
      })
    } else if (tab === "demos") {
      filtered = filtered.filter((demo) => {
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
    searchQuery,
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

  const showSkeleton = isLoading || (!components?.length && !searchQuery)
  const showEmptyState = !isLoading && !components?.length && searchQuery

  const handleGlobalSearch = () => {
    if (!searchQuery) return
    router.push(`/q/${encodeURIComponent(searchQuery)}`)
  }

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
      ) : showEmptyState ? (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
          <div className="text-lg font-semibold mb-2">
            No results found for "{searchQuery}"
          </div>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search or use global search
          </p>
          <Button
            onClick={handleGlobalSearch}
            variant="outline"
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            Search Everywhere
            <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border border-muted-foreground/40 bg-muted px-1.5 ml-1.5 font-mono text-[11px] font-medium text-muted-foreground inline-flex">
              <span className="text-[11px] leading-none font-sans">
                {isMac ? "⌘" : "Ctrl"}
              </span>
              <Icons.enter className="h-2.5 w-2.5" />
            </kbd>
          </Button>
        </div>
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
