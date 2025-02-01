import React from "react"
import { cn } from "@/lib/utils"
import {
  ComponentCard,
  ComponentCardSkeleton,
} from "../features/list-card/card"
import { DemoWithComponent, User, Component } from "@/types/global"

type ComponentOrDemo =
  | DemoWithComponent
  | (Component & { user: User } & { view_count?: number })

export function ComponentsList({
  components,
  isLoading,
  className,
  skeletonCount = 12,
}: {
  components?: ComponentOrDemo[] | null
  isLoading?: boolean
  className?: string
  skeletonCount?: number
}) {
  console.log("ComponentsList received:", {
    components,
    isLoading,
    className,
    skeletonCount,
  })

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 list-none pb-10",
        className,
      )}
    >
      {isLoading ? (
        <>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <ComponentCardSkeleton key={i} />
          ))}
        </>
      ) : (
        components?.map((component) => {
          console.log("Rendering component:", component)
          return (
            <ComponentCard
              key={`${component.id}-${component.updated_at}`}
              component={component}
            />
          )
        })
      )}
    </div>
  )
}

export default ComponentsList
