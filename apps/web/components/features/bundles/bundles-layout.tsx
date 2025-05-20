"use client"

import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { getBundlesAction, type BundleExpanded } from "@/lib/api/bundles"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useRef } from "react"
import { toast } from "sonner"
import { BundleItem } from "./bundle-item"
const PAGE_SIZE = 10

// BundlesLayout renders a list of BundleSlider components
export function BundlesLayout({
  authorId,
  onlyOwned,
  bundles,
  searchQuery,
  hideStatus,
}: {
  authorId?: string
  onlyOwned?: boolean
  bundles?: BundleExpanded[]
  searchQuery?: string
  hideStatus?: boolean
}) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useInfiniteQuery({
    // TODO: Add searchQuery to queryKey with debounce
    queryKey: ["bundles-with-plans-and-demos"],
    queryFn: async ({ pageParam }) => {
      return getBundlesAction({
        authorId,
        onlyOwned,
        offset: pageParam * PAGE_SIZE,
        limit: PAGE_SIZE,
      })
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined
      return allPages.length
    },
    enabled: bundles === undefined,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  // Infinite scroll: fetch next page when loadMoreRef is visible
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )
    const current = loadMoreRef.current
    if (current) observer.observe(current)
    return () => {
      if (current) observer.unobserve(current)
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Add useMemo hook for allBundles before any returns
  const allBundles = useMemo(() => {
    if (bundles) {
      return bundles
    }
    if (!data) {
      return []
    }
    return data.pages.flatMap((page) => page)
  }, [data, bundles])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-0.5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-[242.5px] w-full rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    toast.error("Error loading bundles", {
      description: error.message,
    })
  }
  if (allBundles.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground rounded-lg bg-muted">
        <p className="text-sm">No bundles found</p>
        <p className="text-xs mt-1">Try again later</p>
      </div>
    )

  return (
    <div className="space-y-8">
      {allBundles.map((bundle) => (
        <BundleItem
          key={bundle.id}
          user={bundle.users}
          bundle={bundle}
          hideStatus={hideStatus}
        />
      ))}
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isFetchingNextPage && (
            <div className="flex justify-center">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
