"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function PlanSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-6 w-[120px]" />
          <Skeleton className="h-4 w-[180px]" />
        </div>
        <Skeleton className="h-6 w-[80px] rounded-full" />
      </div>
      <div className="pt-4 border-t">
        <div className="space-y-3">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[180px]" />
          <Skeleton className="h-4 w-[220px]" />
        </div>
      </div>
      <div className="pt-4">
        <Skeleton className="h-9 w-[140px] rounded-md" />
      </div>
    </div>
  )
}
