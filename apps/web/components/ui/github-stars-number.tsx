"use client"

import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

type GitHubStarsProps = {
  className?: string
  repo?: string
}

const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`.replace(".0k", "k")
  }
  return num.toString()
}

export function GitHubStarsBasic({
  className,
  repo = "serafimcloud/21st",
}: GitHubStarsProps) {
  const { data: stars, isLoading } = useQuery({
    queryKey: ["github-stars", repo],
    queryFn: async () => {
      const res = await fetch(`https://api.github.com/repos/${repo}`)
      const data = await res.json()
      return data.stargazers_count as number
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  })

  return (
    <span className={cn("inline-flex items-center", className)}>
      {isLoading ? <Skeleton className="h-5 w-8" /> : formatNumber(stars || 0)}
    </span>
  )
}
