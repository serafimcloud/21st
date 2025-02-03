import { Card, CardHeader } from "@/components/ui/card"

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

export function SectionCardSkeleton() {
  return (
    <div className="p-[1px] animate-pulse">
      <div className="relative aspect-[4/3] mb-3">
        <div className="absolute inset-0">
          <div className="relative w-full h-full rounded-lg shadow-base overflow-hidden">
            <div className="w-full h-full bg-muted rounded-lg" />
          </div>
        </div>
      </div>
      <div className="h-4 bg-muted rounded w-3/4" />
    </div>
  )
}

export function DesignEngineerCardSkeleton() {
  return (
    <div className="p-[1px] animate-pulse">
      <div className="relative bg-background rounded-lg shadow-base overflow-hidden h-[200px]">
        <CardHeader className="relative h-full">
          <div className="flex items-start gap-4 h-full">
            <div className="h-12 w-12 rounded-full bg-muted shadow-base shrink-0" />
            <div className="flex flex-col flex-1 h-full">
              <div className="space-y-2 mb-4">
                <div className="h-6 bg-muted rounded w-1/2" />
                <div className="h-10 bg-muted rounded w-3/4" />
              </div>
              <div className="mt-auto space-y-1.5">
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
        </CardHeader>
      </div>
    </div>
  )
}

export function ProCardSkeleton() {
  return (
    <div className="flex flex-col group p-[1px] animate-pulse">
      <div className="relative aspect-[4/3] mb-3">
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
