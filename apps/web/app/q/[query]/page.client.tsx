"use client"

import React, { useEffect } from "react"
import { useAtom } from "jotai"
import { motion } from "motion/react"
import { searchQueryAtom } from "@/components/ui/header.client"
import { sortByAtom } from "@/components/features/main-page/main-page-header"
import { SortOption } from "@/types/global"
import ComponentsList from "@/components/ui/items-list"

type SearchPageClientProps = {
  initialQuery: string
  initialSortBy: SortOption
}

export function SearchPageClient({
  initialQuery,
  initialSortBy,
}: SearchPageClientProps) {
  const [, setSearchQuery] = useAtom(searchQueryAtom)
  const [sortBy, setSortBy] = useAtom(sortByAtom)

  useEffect(() => {
    setSearchQuery(initialQuery)
    setSortBy(initialSortBy)
  }, [initialQuery, initialSortBy, setSearchQuery, setSortBy])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto my-20 px-[var(--container-x-padding)] max-w-[3680px] [--container-x-padding:20px] min-720:[--container-x-padding:24px] min-1280:[--container-x-padding:32px] min-1536:[--container-x-padding:80px]"
    >
      <div className="flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">
            Search results for "{initialQuery}"
          </h1>
        </div>
        <ComponentsList
          type="search"
          query={initialQuery}
          sortBy={sortBy || initialSortBy}
        />
      </div>
    </motion.div>
  )
}
