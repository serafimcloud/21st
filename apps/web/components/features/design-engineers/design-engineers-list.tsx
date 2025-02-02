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
    staleTime: 1000 * 60 * 5, // 5 минут
    gcTime: 1000 * 60 * 30, // 30 минут
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {Array(6)
          .fill(0)
          .map((_, index) => (
            <DesignEngineerCardSkeleton key={index} />
          ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
      {authors?.map((author) => (
        <Link
          href={`/${author.display_username || author.username}`}
          key={author.id}
        >
          <Card className="h-full hover:bg-accent/50 transition-colors">
            <CardHeader className="h-full">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 bg-muted/30">
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
                <div className="flex flex-col h-full">
                  <div className="space-y-1 mb-4">
                    <h2 className="font-semibold text-lg">
                      {author.display_name || author.name || author.username}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-1 h-5">
                      {author.bio ||
                        `@${author.display_username || author.username}`}
                    </p>
                  </div>
                  <div className="mt-auto space-y-0.5">
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
          </Card>
        </Link>
      ))}
    </div>
  )
}
