import React, { useEffect } from "react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import {
  ComponentCard,
} from "../features/list-card/card"
import { DemoWithComponent, User, Component, SortOption } from "@/types/global"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { transformDemoResult } from "@/lib/utils/transformData"
import { Database } from "@/types/supabase"
import { Loader2, Search } from "lucide-react"
import { useAtom } from "jotai"
import { tagPageSearchAtom } from "../features/tag-page/tag-page-header"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useHotkeys } from "react-hotkeys-hook"
import { isMac } from "@/lib/utils"
import { Icons } from "@/components/icons"
import { ComponentCardSkeleton } from "./skeletons"

type ComponentOrDemo =
  | DemoWithComponent
  | (Component & { user: User } & { view_count?: number })

type ListType = "main" | "tag" | "user" | "search"

interface BaseListProps {
  className?: string
  skeletonCount?: number
  initialData?: ComponentOrDemo[]
}

interface MainListProps extends BaseListProps {
  type: "main"
  sortBy: SortOption
}

interface TagListProps extends BaseListProps {
  type: "tag"
  tagSlug: string
  sortBy: SortOption
}

interface UserListProps extends BaseListProps {
  type: "user"
  userId: string
  tab: "published" | "hunted" | "demos" | "liked"
}

interface SearchListProps extends BaseListProps {
  type: "search"
  query: string
  sortBy: SortOption
}

type ComponentsListProps =
  | MainListProps
  | TagListProps
  | UserListProps
  | SearchListProps

function useMainDemos(sortBy: SortOption, initialData?: ComponentOrDemo[]) {
  const supabase = useClerkSupabaseClient()
  return useInfiniteQuery({
    queryKey: ["filtered-demos", sortBy] as const,
    queryFn: async ({ pageParam = 0 }) => {
      const { data: filteredData, error } = await supabase.rpc("get_demos", {
        p_quick_filter: "all",
        p_sort_by: sortBy,
        p_offset: Number(pageParam) * 24,
        p_limit: 24,
        p_tag_slug: undefined,
        p_include_private: false,
      } as Database["public"]["Functions"]["get_demos"]["Args"])

      if (error) throw error
      const transformedData = (filteredData || []).map(transformDemoResult)
      return {
        data: transformedData,
        total_count: (filteredData?.[0] as any)?.total_count ?? 0,
      }
    },
    initialData: initialData
      ? {
          pages: [
            {
              data: initialData as DemoWithComponent[],
              total_count: initialData.length,
            },
          ],
          pageParams: [0],
        }
      : undefined,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.data || lastPage.data.length === 0) return undefined
      const loadedCount = allPages.reduce(
        (sum, page) => sum + page.data.length,
        0,
      )
      return loadedCount < lastPage.total_count ? allPages.length : undefined
    },
    initialPageParam: 0,
  })
}

function useTagDemos(
  tagSlug: string,
  sortBy: SortOption,
  initialData?: ComponentOrDemo[],
) {
  const supabase = useClerkSupabaseClient()
  return useQuery({
    queryKey: ["tag-filtered-demos", tagSlug, sortBy] as const,
    queryFn: async () => {
      const { data: filteredData, error } = await supabase.rpc("get_demos", {
        p_quick_filter: "all",
        p_sort_by: sortBy,
        p_offset: 0,
        p_limit: 1000,
        p_tag_slug: tagSlug,
      })

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

function useUserDemos(
  userId: string,
  tab: UserListProps["tab"],
  initialData?: ComponentOrDemo[],
) {
  const supabase = useClerkSupabaseClient()
  return useQuery({
    queryKey: ["user-demos", userId, tab] as const,
    queryFn: async () => {
      let data: any[] = []
      switch (tab) {
        case "published":
          const { data: userDemos } = await supabase.rpc("get_user_demos", {
            p_user_id: userId,
          })
          data = userDemos || []
          break
        case "hunted":
          const { data: huntedComponents } = await supabase.rpc(
            "get_hunted_components",
            {
              p_hunter_username: userId,
            },
          )
          data = huntedComponents || []
          break
      }
      return {
        data: data.map(transformDemoResult),
        total_count: data.length,
      }
    },
    initialData: initialData
      ? {
          data: initialData as DemoWithComponent[],
          total_count: initialData.length,
        }
      : undefined,
  })
}

function useSearchDemos(
  query: string,
  sortBy: SortOption,
  initialData?: ComponentOrDemo[],
) {
  const supabase = useClerkSupabaseClient()
  return useInfiniteQuery({
    queryKey: ["search-results", query, sortBy] as const,
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const { data: searchResults, error } = await supabase.functions.invoke(
          "ai-search-oai",
          {
            body: {
              search: query,
              match_threshold: 0.33,
            },
          },
        )

        if (error) throw error
        if (!searchResults || !Array.isArray(searchResults)) {
          return { data: [], total_count: 0 }
        }

        const transformedResults = searchResults
          .map((result) => {
            const componentData = result.component_data as Component
            const userData = result.user_data as User

            if (!componentData || !userData) {
              return null
            }

            const componentWithUser = {
              ...componentData,
              user: userData,
            }

            const demoComponent: DemoWithComponent = {
              compiled_css: componentData.compiled_css,
              component_id: componentData.id,
              created_at: result.created_at || null,
              demo_code: componentData.demo_code || "",
              demo_dependencies: componentData.dependencies,
              demo_direct_registry_dependencies: {},
              demo_slug: result.demo_slug || "default",
              id: result.id,
              name: result.name || "Default",
              preview_url: result.preview_url,
              user: userData,
              user_id: userData.id,
              video_url: result.video_url,
              view_count: result.view_count || 0,
              component: componentWithUser,
              tags: [],
              embedding: null,
              embedding_oai: null,
              fts: null,
              pro_preview_image_url: null,
              updated_at: result.updated_at || null,
            }

            return demoComponent
          })
          .filter((item): item is DemoWithComponent => item !== null)

        return {
          data: transformedResults,
          total_count: transformedResults.length,
        }
      } catch (err) {
        return { data: [], total_count: 0 }
      }
    },
    initialData: initialData
      ? {
          pages: [
            {
              data: initialData as DemoWithComponent[],
              total_count: initialData.length,
            },
          ],
          pageParams: [0],
        }
      : undefined,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.data || lastPage.data.length === 0) return undefined
      const loadedCount = allPages.reduce(
        (sum, page) => sum + page.data.length,
        0,
      )
      return loadedCount < lastPage.total_count ? allPages.length : undefined
    },
    initialPageParam: 0,
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
    if (component.component.name?.toLowerCase().includes(query)) return true
    if (component.user.name?.toLowerCase().includes(query)) return true
    if (component.component.description?.toLowerCase().includes(query))
      return true
    if (component.tags?.some((tag) => tag.name.toLowerCase().includes(query)))
      return true
    return false
  })
}

export function ComponentsList({
  className,
  skeletonCount = 40,
  initialData,
  ...props
}: ComponentsListProps) {
  const [localSearchQuery, setLocalSearchQuery] = useAtom(tagPageSearchAtom)
  const router = useRouter()

  const mainQuery = useMainDemos(
    props.type === "main" ? props.sortBy : "recommended",
    props.type === "main" ? initialData : undefined,
  )

  const tagQuery = useTagDemos(
    props.type === "tag" ? props.tagSlug : "",
    props.type === "tag" ? props.sortBy : "recommended",
    props.type === "tag" ? initialData : undefined,
  )

  const userQuery = useUserDemos(
    props.type === "user" ? props.userId : "",
    props.type === "user" ? props.tab : "published",
    props.type === "user" ? initialData : undefined,
  )

  const aiSearchQuery = useSearchDemos(
    props.type === "search" ? props.query : "",
    props.type === "search" ? props.sortBy : "recommended",
    props.type === "search" ? initialData : undefined,
  )

  const rawComponents = React.useMemo(() => {
    switch (props.type) {
      case "main":
        return mainQuery.data?.pages?.flatMap((page) => page.data)
      case "tag":
        return tagQuery.data?.data
      case "user":
        return userQuery.data?.data
      case "search":
        return aiSearchQuery.data?.pages?.flatMap((page) => page.data)
    }
  }, [
    props.type,
    mainQuery.data,
    tagQuery.data,
    userQuery.data,
    aiSearchQuery.data,
  ])

  // Очищаем поисковый запрос при размонтировании
  React.useEffect(() => {
    return () => {
      setLocalSearchQuery("")
    }
  }, [setLocalSearchQuery])

  // Заменяем все использования searchQuery на localSearchQuery
  const components = React.useMemo(() => {
    if (props.type === "tag") {
      return filterComponentsBySearch(rawComponents, localSearchQuery)
    }
    return rawComponents
  }, [props.type, rawComponents, localSearchQuery])

  const isLoading = React.useMemo(() => {
    switch (props.type) {
      case "main":
        return mainQuery.isLoading
      case "tag":
        return tagQuery.isLoading
      case "user":
        return userQuery.isLoading
      case "search":
        return aiSearchQuery.isLoading
    }
  }, [
    props.type,
    mainQuery.isLoading,
    tagQuery.isLoading,
    userQuery.isLoading,
    aiSearchQuery.isLoading,
  ])

  const isFetching = React.useMemo(() => {
    switch (props.type) {
      case "main":
        return mainQuery.isFetching
      case "tag":
        return tagQuery.isFetching
      case "user":
        return userQuery.isFetching
      case "search":
        return aiSearchQuery.isFetching
    }
  }, [
    props.type,
    mainQuery.isFetching,
    tagQuery.isFetching,
    userQuery.isFetching,
    aiSearchQuery.isFetching,
  ])

  const hasNextPage = React.useMemo(() => {
    switch (props.type) {
      case "main":
        return mainQuery.hasNextPage
      case "search":
        return aiSearchQuery.hasNextPage
      default:
        return false
    }
  }, [props.type, mainQuery.hasNextPage, aiSearchQuery.hasNextPage])

  const fetchNextPage = React.useMemo(() => {
    switch (props.type) {
      case "main":
        return mainQuery.fetchNextPage
      case "search":
        return aiSearchQuery.fetchNextPage
      default:
        return undefined
    }
  }, [props.type, mainQuery.fetchNextPage, aiSearchQuery.fetchNextPage])

  useEffect(() => {
    if (!["main", "search"].includes(props.type)) return

    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 1000 &&
        !isLoading &&
        hasNextPage
      ) {
        fetchNextPage?.()
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isLoading, hasNextPage, fetchNextPage, props.type])

  const showSkeleton = isLoading || (!components?.length && !localSearchQuery)
  const showSpinner = isFetching && !showSkeleton
  const showEmptyState = !isLoading && !components?.length && localSearchQuery

  const handleGlobalSearch = () => {
    if (!localSearchQuery) return
    router.push(`/q/${encodeURIComponent(localSearchQuery)}`)
  }

  // Добавляем хоткей для глобального поиска
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
    [localSearchQuery],
  )

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 list-none pb-10",
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
              No results found for "{localSearchQuery}"
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
              component={component}
            />
          ))
        )}
      </div>
      {showSpinner && (
        <div className="col-span-full flex justify-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-foreground/20" />
        </div>
      )}
    </>
  )
}

export default ComponentsList
