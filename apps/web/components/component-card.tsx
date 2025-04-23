"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface ComponentCardProps {
  id: string
  name: string
  description?: string
  previewUrl?: string
  author?: {
    username: string
    avatarUrl?: string
  }
  category?: string
  votes?: number
  className?: string
}

export function ComponentCard({
  id,
  name,
  description,
  previewUrl,
  author,
  category,
  votes,
  className,
}: ComponentCardProps) {
  return (
    <Link href={`/components/${id}`}>
      <div
        className={`overflow-hidden rounded-lg border bg-background shadow hover:shadow-md transition-shadow ${className || ""}`}
      >
        <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <p className="text-sm text-muted-foreground">No preview</p>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-semibold">{name}</h3>
            {votes !== undefined && (
              <span className="text-xs bg-muted px-2 py-1 rounded-full">
                {votes} votes
              </span>
            )}
          </div>

          {description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          )}

          <div className="flex items-center justify-between mt-2">
            {author && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Avatar className="h-5 w-5 mr-1">
                  <AvatarImage src={author.avatarUrl} />
                  <AvatarFallback>
                    {author.username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{author.username}</span>
              </div>
            )}

            {category && (
              <Badge variant="outline" className="text-xs">
                {category}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
