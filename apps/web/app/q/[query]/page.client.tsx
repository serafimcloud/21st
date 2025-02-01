"use client"

import React, { useEffect } from "react"
import { useAtom } from "jotai"
import { motion } from "framer-motion"
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
      className="container mx-auto mt-20 px-4 max-w-[1200px]"
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
