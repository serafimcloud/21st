import { ComponentCard } from "@/components/features/list-card/card"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  ComponentCardSkeleton,
  ProfileCardSkeleton,
} from "@/components/ui/skeletons"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { cn, isMac } from "@/lib/utils"
import { transformDemoResult } from "@/lib/utils/transformData"
import { DemoWithComponent } from "@/types/global"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { Bookmark, Code, Plus, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import React from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { userPageSearchAtom } from "./user-page-header"

type UserTab = "components" | "demos" | "bookmarks" | "purchased_bundles"

interface UserItemsListProps {
  className?: string
  skeletonCount?: number
  userId: string
  tab: UserTab
  isOwnProfile: boolean
}

function useUserPublishedDemos(userId: string) {
  const supabase = useClerkSupabaseClient()
  return useQuery({
    queryKey: ["user-published-demos", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_profile_demo_list", {
        p_user_id: userId,
        p_include_private: false,
      })
      if (error) throw error
      return data.map(transformDemoResult)
    },
    staleTime: 30 * 1000,
  })
}

function useUserLikedComponents(userId: string) {
  const supabase = useClerkSupabaseClient()
  return useQuery({
    queryKey: ["user-liked-components", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_bookmarks_list", {
        p_user_id: userId,
        p_include_private: false,
      })
      if (error) throw error
      return data.map(transformDemoResult)
    },
    staleTime: 30 * 1000,
  })
}

function useUserDemos(userId: string) {
  const supabase = useClerkSupabaseClient()
  return useQuery({
    queryKey: ["user-demos", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_profile_demo_list", {
        p_user_id: userId,
        p_include_private: false,
      })
      if (error) throw error
      return data.map(transformDemoResult)
    },
    staleTime: 30 * 1000,
  })
}

function filterComponentsBySearch(
  components: DemoWithComponent[] | undefined,
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

function EmptyLikedState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <Bookmark className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">No bookmarked components</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-[420px]">
        When you bookmark a component, it will appear here for quick access
      </p>
    </div>
  )
}

function EmptyComponentsState({ isOwnProfile }: { isOwnProfile: boolean }) {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <Code className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">
        {isOwnProfile
          ? "No published components yet"
          : "No components published yet"}
      </h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-[420px]">
        {isOwnProfile
          ? "Start sharing your components with the community"
          : "This user hasn't published any components yet"}
      </p>
      {isOwnProfile && (
        <Button onClick={() => router.push("/publish")} className="mt-6 gap-2">
          <Plus className="h-4 w-4" />
          Publish Component
        </Button>
      )}
    </div>
  )
}

export function UserItemsList({
  className,
  skeletonCount = 12,
  userId,
  tab,
  isOwnProfile,
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
    tab === "components" ? userId : "",
  )

  const likedQuery = useUserLikedComponents(tab === "bookmarks" ? userId : "")

  const demosQuery = useUserDemos(tab === "demos" ? userId : "")

  const components = React.useMemo(() => {
    const allDemos =
      (() => {
        switch (tab) {
          case "components":
            return publishedQuery.data
          case "demos":
            return demosQuery.data
          case "bookmarks":
            return likedQuery.data
          default:
            return []
        }
      })() || []

    let filtered = filterComponentsBySearch(allDemos, searchQuery) || []

    if (tab === "components") {
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
    demosQuery.data,
    likedQuery.data,
    userId,
    searchQuery,
  ])

  const isLoading = React.useMemo(() => {
    switch (tab) {
      case "components":
        return publishedQuery.isLoading
      case "demos":
        return demosQuery.isLoading
      case "bookmarks":
        return likedQuery.isLoading
      default:
        return false
    }
  }, [
    tab,
    publishedQuery.isLoading,
    demosQuery.isLoading,
    likedQuery.isLoading,
  ])

  const showSkeleton = isLoading || (!components?.length && !searchQuery)
  const showEmptyState = !isLoading && !components?.length && searchQuery

  const handleGlobalSearch = () => {
    if (!searchQuery) return
    router.push(`/q/${encodeURIComponent(searchQuery)}`)
  }

  if (
    tab === "bookmarks" &&
    !isLoading &&
    components.length === 0 &&
    !searchQuery
  ) {
    return <EmptyLikedState />
  }

  if (
    tab === "components" &&
    !isLoading &&
    components.length === 0 &&
    !searchQuery
  ) {
    return <EmptyComponentsState isOwnProfile={isOwnProfile} />
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 list-none pb-10 max-w-[3680px] mx-auto",
        className,
      )}
    >
      {showSkeleton ? (
        <>
          {Array.from({ length: skeletonCount }).map((_, i) =>
            tab === "components" ? (
              <ProfileCardSkeleton key={i} />
            ) : (
              <ComponentCardSkeleton key={i} />
            ),
          )}
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
        components?.map((component: DemoWithComponent) => (
          <ComponentCard
            key={`${component.id}-${component.updated_at}`}
            demo={component}
            hideUser={tab === "components"}
          />
        ))
      )}
    </div>
  )
}
