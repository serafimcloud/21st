"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Eye, Download } from "lucide-react"
import { Card, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { DesignEngineerCardSkeleton } from "@/components/ui/skeletons"
import { useClerkSupabaseClient } from "@/lib/clerk"

interface DesignEngineersListProps {
  className?: string
}

export function DesignEngineersList({ className }: DesignEngineersListProps) {
  const supabaseWithAdminAccess = useClerkSupabaseClient()

  const { data: authors, isLoading } = useQuery({
    queryKey: ["active-authors"],
    queryFn: async () => {
      const { data } = await supabaseWithAdminAccess.rpc("get_active_authors")
      return data || []
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 list-none pb-10">
        {Array(24)
          .fill(0)
          .map((_, index) => (
            <DesignEngineerCardSkeleton key={index} />
          ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 list-none pb-10">
      {authors?.map((author) => (
        <Link
          href={`/${author.display_username || author.username}`}
          key={author.id}
          className="block p-[1px]"
        >
          <div className="group relative bg-background rounded-lg shadow-base overflow-hidden h-[200px]">
            <div className="absolute inset-0 bg-gradient-to-b from-background to-accent/10 group-hover:to-accent/20 transition-colors" />
            <CardHeader className="relative h-full">
              <div className="flex items-start gap-4 h-full">
                <Avatar className="h-12 w-12 shadow-base bg-muted/30 shrink-0">
                  {author.display_image_url || author.image_url ? (
                    <AvatarImage
                      src={author.display_image_url || author.image_url || ""}
                      alt={
                        author.display_name ||
                        author.name ||
                        author.username ||
                        ""
                      }
                    />
                  ) : (
                    <AvatarFallback>
                      {(
                        (author.display_name ||
                          author.name ||
                          author.username ||
                          "?")?.[0] || "?"
                      ).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col flex-1 h-full">
                  <div className="space-y-1 mb-4">
                    <h2 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {author.display_name || author.name || author.username}
                    </h2>
                    <p className="text-sm text-muted-foreground h-10 line-clamp-2">
                      {author.bio ||
                        `@${author.display_username || author.username}`}
                    </p>
                  </div>
                  <div className="mt-auto space-y-1.5">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">
                        {author.total_views.toLocaleString()} views
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Download className="w-4 h-4" />
                      <span className="text-sm">
                        {(
                          author.total_usages + author.total_downloads
                        ).toLocaleString()}{" "}
                        usages
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </div>
        </Link>
      ))}
    </div>
  )
}
