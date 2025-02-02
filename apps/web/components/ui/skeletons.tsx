import { Card, CardHeader } from "@/components/ui/card"

export function ComponentCardSkeleton() {
  return (
    <div className="overflow-hidden animate-pulse">
      <div className="relative aspect-[4/3] mb-3">
        <div className="absolute inset-0 rounded-lg overflow-hidden bg-muted" />
      </div>
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-muted" />
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
    <div className="overflow-hidden animate-pulse">
      <div className="relative aspect-[4/3] mb-3">
        <div className="absolute inset-0 rounded-lg overflow-hidden bg-muted" />
      </div>
      <div className="h-4 bg-muted rounded w-3/4" />
    </div>
  )
}

export function DesignEngineerCardSkeleton() {
  return (
    <Card className="h-full animate-pulse">
      <CardHeader className="h-full">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-muted" />
          <div className="flex flex-col h-full flex-1">
            <div className="space-y-2 mb-4">
              <div className="h-6 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
            <div className="mt-auto space-y-2">
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
    </Card>
  )
}

export function ProCardSkeleton() {
  return (
    <div className="flex flex-col group animate-pulse">
      <div className="relative aspect-[16/9] mb-3">
        <div className="absolute inset-0 rounded-lg bg-muted" />
      </div>
      <div className="flex items-center space-x-3">
        <div className="h-6 w-6 rounded-full bg-muted" />
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
