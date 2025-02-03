"use client"

import { useQuery } from "@tanstack/react-query"
import { DesignEngineerCardSkeleton } from "@/components/ui/skeletons"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { DesignEngineerCard } from "./design-engineer-card"
import { Database } from "@/types/supabase"

type DatabaseAuthor =
  Database["public"]["Functions"]["get_active_authors_with_top_components"]["Returns"][0]

interface TopComponent {
  id: string
  name: string
  component_slug: string
  preview_url: string
  video_url: string | null
  demo_slug: string
  demo_name: string
  downloads_count: number
  likes_count: number
  view_count: number
  usage_count: number
  recommendation_score: number
}

interface DesignEngineersListProps {
  className?: string
  page?: number
  pageSize?: number
}

export function DesignEngineersList({
  className,
  page = 1,
  pageSize = 20,
}: DesignEngineersListProps) {
  const supabaseWithAdminAccess = useClerkSupabaseClient()

  const { data, isLoading } = useQuery({
    queryKey: ["active-authors", page, pageSize],
    queryFn: async () => {
      const offset = (page - 1) * pageSize
      const { data, error } = await supabaseWithAdminAccess.rpc(
        "get_active_authors_with_top_components",
        {
          p_offset: offset,
          p_limit: pageSize,
        },
      )

      if (error) {
        throw error
      }

      return (data || []) as DatabaseAuthor[]
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  if (isLoading) {
    return (
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-8 list-none pb-10 ${className || ""}`}
      >
        {Array(pageSize)
          .fill(0)
          .map((_, index) => (
            <DesignEngineerCardSkeleton key={index} />
          ))}
      </div>
    )
  }

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 gap-8 list-none pb-10 ${className || ""}`}
    >
      {data?.map((author) => (
        <DesignEngineerCard key={author.id} author={author} />
      ))}
    </div>
  )
}
