import { Copy, Download, Link } from "lucide-react"

export function ComponentCardSkeleton() {
  return (
    <div className="p-[1px] animate-pulse">
      <div className="relative aspect-[4/3] mb-3">
        <div className="absolute inset-0">
          <div className="relative w-full h-full rounded-lg shadow-base overflow-hidden">
            <div className="w-full h-full bg-muted rounded-lg" />
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-muted shadow-base" />
        <div className="flex items-center justify-between flex-grow min-w-0">
          <div className="min-w-0 flex-1 mr-3">
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
          <div className="h-3 bg-muted rounded w-12" />
        </div>
      </div>
    </div>
  )
}

export function CategoryCardSkeleton() {
  return (
    <div className="p-[1px] animate-pulse">
      <div className="relative aspect-[4/3] mb-4">
        <div className="absolute inset-0">
          <div className="relative w-full h-full rounded-lg shadow-base overflow-hidden">
            <div className="w-full h-full bg-muted rounded-lg" />
          </div>
        </div>
      </div>
      <div className="h-4 bg-muted rounded w-2/4" />
    </div>
  )
}

export function DesignEngineerCardSkeleton() {
  return (
    <div className="block p-[1px] animate-pulse">
      <div className="relative bg-background rounded-lg shadow-base p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-accent/10" />

        <div className="relative flex flex-col lg:flex-row gap-6">
          {/* Author Info Section */}
          <div className="w-full lg:w-1/2 relative z-10">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-muted shadow-base shrink-0" />
              <div className="flex flex-col flex-1">
                <div className="flex flex-col">
                  <div className="h-6 bg-muted rounded w-1/2" />
                  <div className="space-y-1.5 mt-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-1.5 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-muted" />
                    <div className="h-4 bg-muted rounded w-24" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-muted" />
                    <div className="h-4 bg-muted rounded w-28" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Components Cards Section - Empty Space */}
          <div className="w-full lg:w-1/2 relative min-h-[156px] lg:min-h-[150px]" />
        </div>
      </div>
    </div>
  )
}

export function ProCardSkeleton() {
  return (
    <div className="flex flex-col group p-[1px] animate-pulse">
      <div className="relative aspect-[16/10] mb-3">
        <div className="absolute inset-0">
          <div className="relative w-full h-full rounded-lg shadow-base overflow-hidden">
            <div className="w-full h-full bg-muted rounded-lg" />
          </div>
        </div>
      </div>
      <div className="flex space-x-3 items-center">
        <div className="h-8 w-8 rounded-full bg-muted shadow-base" />
        <div className="flex items-center justify-between flex-grow min-w-0">
          <div className="flex-1 mr-3">
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
          <div className="h-4 bg-muted rounded w-12" />
        </div>
      </div>
    </div>
  )
}

export function TemplateCardSkeleton() {
  return (
    <div className="p-[1px] animate-pulse">
      <div className="relative aspect-[16/10] mb-3">
        <div className="absolute inset-0">
          <div className="relative w-full h-full rounded-lg shadow-base overflow-hidden">
            <div className="w-full h-full bg-muted rounded-lg" />
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-muted shadow-base" />
        <div className="flex items-center justify-between flex-grow min-w-0">
          <div className="min-w-0 flex-1">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2 mt-1" />
          </div>
          <div className="h-4 bg-muted rounded w-12 ml-3" />
        </div>
      </div>
    </div>
  )
}

export function LogoCardSkeleton() {
  const shapes = [
    "rounded-full",
    "rounded-md",
    "rounded-sm",
    "rounded-lg",
    "rounded-xl",
  ]
  const randomShape = shapes[Math.floor(Math.random() * shapes.length)]

  return (
    <div className="group flex flex-col items-center justify-center rounded-md border border-neutral-200 p-4 transition-colors duration-100 dark:border-neutral-800 min-h-[190px]">
      <div className={`mb-4 mt-2 h-10 w-10 bg-muted ${randomShape}`} />
      <div className="mb-3 flex flex-col items-center justify-center space-y-1">
        <div className="h-[22px] w-24 rounded bg-muted" />
        <div className="flex items-center justify-center space-x-1">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-mono hover:bg-neutral-200 dark:hover:bg-neutral-700/50 transition-colors duration-100">
            Category
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-1">
        <button
          disabled
          className="flex items-center space-x-2 rounded-md p-2 duration-100 opacity-50"
        >
          <Copy className="h-4 w-4 stroke-[1.8] text-muted-foreground" />
        </button>
        <button
          disabled
          className="flex items-center space-x-2 rounded-md p-2 duration-100 opacity-50"
        >
          <Download className="h-4 w-4 stroke-[1.8] text-muted-foreground" />
        </button>
        <button
          disabled
          className="flex items-center space-x-2 rounded-md p-2 duration-100 opacity-50"
        >
          <Link className="h-4 w-4 stroke-[1.8] text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}

export function ProfileCardSkeleton() {
  return (
    <div className="p-[1px] animate-pulse">
      <div className="relative aspect-[4/3] mb-3">
        <div className="absolute inset-0">
          <div className="relative w-full h-full rounded-lg shadow-base overflow-hidden">
            <div className="w-full h-full bg-muted rounded-lg" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
        <div className="h-3 bg-muted rounded w-12 ml-3" />
      </div>
    </div>
  )
}

export function LeaderboardCardSkeleton() {
  return (
    <div className="group relative flex flex-col sm:flex-row items-start gap-4 rounded-xl px-0 py-4 transition-all duration-300 sm:-mx-4 sm:p-4">
      {/* Preview Image Skeleton */}
      <div className="relative aspect-[4/3] w-full sm:w-56 mb-4 sm:mb-0">
        <div className="absolute inset-0">
          <div className="relative w-full h-full rounded-lg shadow-base overflow-hidden">
            <div className="w-full h-full bg-muted" />
          </div>
        </div>
      </div>

      {/* Content Area Skeleton */}
      <div className="flex-1 flex flex-row justify-between w-full">
        {/* Left column Skeleton */}
        <div className="flex flex-col space-y-2 flex-1 sm:min-h-24 justify-between">
          <div className="space-y-2">
            {/* Title Skeleton */}
            <div className="h-5 bg-muted rounded w-3/4 animate-pulse" />

            {/* Description Skeleton */}
            <div className="h-5 bg-muted rounded w-1/2 animate-pulse" />

            {/* User Avatar Skeleton */}
            <div className="flex items-center gap-2 mt-1">
              <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
              <div className="h-4 bg-muted rounded w-24 animate-pulse" />
            </div>
          </div>

          {/* Tags Skeleton */}
          <div className="flex flex-row flex-wrap items-center gap-2 mt-2">
            <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded w-16 animate-pulse" />
            <div className="h-4 bg-muted rounded w-12 animate-pulse" />
          </div>
        </div>

        {/* Votes Skeleton */}
        <div className="flex ml-4 shrink-0">
          <div className="size-12 rounded-lg border bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  )
}
