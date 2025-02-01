"use client"

import React, { useEffect, useState } from "react"
import { useAtom } from "jotai"
import { useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { useSearchParams, useRouter } from "next/navigation"

import { SortOption, SORT_OPTIONS } from "@/types/global"
import { sortByAtom } from "@/components/features/main-page/main-page-header"
import ComponentsList from "@/components/ui/items-list"
import SectionsList from "@/components/features/sections/sections-list"
import { ComponentsHeader } from "@/components/features/main-page/main-page-header"

export function HomePageClient() {
  const [sortBy, setSortBy] = useAtom(sortByAtom)
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"sections" | "components">(
    (searchParams.get("tab") as "sections" | "components") || "sections",
  )

  // Обновляем URL при изменении параметров
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", activeTab)
    if (activeTab === "components" && sortBy) {
      params.set("sort", sortBy)
    } else {
      params.delete("sort")
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }, [activeTab, sortBy, router, searchParams])

  // Инициализируем sortBy из URL при загрузке
  useEffect(() => {
    const sortFromUrl = searchParams.get("sort") as SortOption
    if (sortFromUrl && Object.keys(SORT_OPTIONS).includes(sortFromUrl)) {
      setSortBy(sortFromUrl)
    }
  }, [])

  useEffect(() => {
    if (sortBy !== undefined) {
      queryClient.invalidateQueries({
        queryKey: ["filtered-demos", sortBy],
      })
    }
  }, [sortBy, queryClient])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto mt-20 px-4 max-w-[1200px]"
    >
      <div className="flex flex-col">
        <ComponentsHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          filtersDisabled={false}
        />
        {activeTab === "sections" ? (
          <SectionsList />
        ) : (
          <ComponentsList type="main" sortBy={sortBy} />
        )}
      </div>
    </motion.div>
  )
}
