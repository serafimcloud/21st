"use client"

import React, { useEffect, useState } from "react"
import { useAtom } from "jotai"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Download, Eye } from "lucide-react"
import { load } from "cheerio"

import { SortOption, SORT_OPTIONS } from "@/types/global"
import { sortByAtom } from "@/components/features/main-page/main-page-header"
import { ComponentsList } from "@/components/ui/items-list"
import { SectionsList } from "@/components/features/sections/sections-list"
import { ComponentsHeader } from "@/components/features/main-page/main-page-header"
import { Card, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { UserAvatar } from "@/components/ui/user-avatar"
import { useClerkSupabaseClient } from "@/lib/clerk"
import {
  DesignEngineerCardSkeleton,
  ProCardSkeleton,
} from "@/components/ui/skeletons"
import { FilterChips } from "@/components/features/main-page/filter-chips"

export function HomePageClient() {
  const [sortBy, setSortBy] = useAtom(sortByAtom)
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabaseWithAdminAccess = useClerkSupabaseClient()
  const [activeTab, setActiveTab] = useState<
    "sections" | "components" | "authors" | "pro"
  >(
    (searchParams.get("tab") as
      | "sections"
      | "components"
      | "authors"
      | "pro") || "sections",
  )
  const [selectedFilter, setSelectedFilter] = useState<string>(
    searchParams.get("filter") || "all",
  )

  const { data: authors, isLoading: isAuthorsLoading } = useQuery({
    queryKey: ["active-authors"],
    queryFn: async () => {
      const { data } = await supabaseWithAdminAccess.rpc("get_active_authors")
      return data || []
    },
    enabled: activeTab === "authors",
  })

  const { data: publishers, isLoading: isPublishersLoading } = useQuery({
    queryKey: ["pro-publishers"],
    queryFn: async () => {
      const { data: publishersData } = await supabaseWithAdminAccess
        .from("users")
        .select("*")
        .not("pro_referral_url", "is", null)
        .not("pro_referral_url", "eq", "")
        .order("created_at", { ascending: true })

      if (!publishersData) return []

      const publishersWithImages = await Promise.all(
        publishersData.map(async (publisher) => {
          if (!publisher.pro_banner_url) {
            return {
              ...publisher,
              image: publisher.pro_banner_url,
            }
          }

          return {
            ...publisher,
            image: publisher.pro_banner_url,
          }
        }),
      )
      return publishersWithImages
    },
    enabled: activeTab === "pro",
  })

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

  const renderContent = () => {
    switch (activeTab) {
      case "sections":
        return (
          <>
            <FilterChips
              activeTab={activeTab}
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
            />
            <SectionsList filter={selectedFilter} />
          </>
        )
      case "components":
        return (
          <>
            <FilterChips
              activeTab={activeTab}
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
            />
            <ComponentsList
              type="main"
              sortBy={sortBy}
              tagSlug={selectedFilter === "all" ? undefined : selectedFilter}
            />
          </>
        )
      case "authors":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {isAuthorsLoading
              ? Array(6)
                  .fill(0)
                  .map((_, index) => <DesignEngineerCardSkeleton key={index} />)
              : authors?.map((author) => (
                  <Link
                    href={`/${author.display_username || author.username}`}
                    key={author.id}
                  >
                    <Card className="h-full hover:bg-accent/50 transition-colors">
                      <CardHeader className="h-full">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12 bg-muted/30">
                            {author.display_image_url || author.image_url ? (
                              <AvatarImage
                                src={
                                  author.display_image_url ||
                                  author.image_url ||
                                  ""
                                }
                                alt={
                                  author.display_name ||
                                  author.name ||
                                  author.username ||
                                  ""
                                }
                              />
                            ) : (
                              <AvatarFallback>
                                {(
                                  (author.display_name ||
                                    author.name ||
                                    author.username ||
                                    "?")?.[0] || "?"
                                ).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex flex-col h-full">
                            <div className="space-y-1 mb-4">
                              <h2 className="font-semibold text-lg">
                                {author.display_name ||
                                  author.name ||
                                  author.username}
                              </h2>
                              <p className="text-sm text-muted-foreground line-clamp-1 h-5">
                                {author.bio ||
                                  `@${author.display_username || author.username}`}
                              </p>
                            </div>
                            <div className="mt-auto space-y-0.5">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Eye className="w-4 h-4" />
                                <span className="text-sm">
                                  {author.total_views.toLocaleString()} views
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Download className="w-4 h-4" />
                                <span className="text-sm">
                                  {(
                                    author.total_usages + author.total_downloads
                                  ).toLocaleString()}{" "}
                                  usages
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
          </div>
        )
      case "pro":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {isPublishersLoading
              ? Array(6)
                  .fill(0)
                  .map((_, index) => <ProCardSkeleton key={index} />)
              : publishers?.map((publisher) => (
                  <div className="flex flex-col group" key={publisher.id}>
                    <Link
                      href={publisher.pro_referral_url!!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block cursor-pointer"
                    >
                      <div className="relative aspect-[16/9] mb-3 group">
                        <div className="absolute inset-0 rounded-lg overflow-hidden">
                          <div className="relative w-full h-full">
                            <div
                              className="absolute inset-0"
                              style={{ margin: "-1px" }}
                            >
                              {publisher.image ? (
                                <Image
                                  src={publisher.image}
                                  alt={`${publisher.name || publisher.username}'s Pro Components`}
                                  fill
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <span className="text-gray-400">
                                    No preview available
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-b from-foreground/0 to-foreground/5" />
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center space-x-3">
                      <UserAvatar
                        src={
                          publisher.display_image_url ||
                          publisher.image_url ||
                          "/placeholder.svg"
                        }
                        alt={
                          publisher.display_name ||
                          publisher.name ||
                          publisher.username ||
                          ""
                        }
                        size={24}
                        user={publisher}
                        isClickable
                      />
                      <div className="flex items-center justify-between flex-grow min-w-0">
                        <Link
                          href={publisher.pro_referral_url || "#"}
                          className="block cursor-pointer min-w-0 flex-1 mr-3"
                        >
                          <h2 className="text-sm font-medium text-foreground truncate">
                            {publisher.display_name ||
                              publisher.name ||
                              publisher.username}
                          </h2>
                        </Link>
                        <Link
                          target="_blank"
                          href={publisher.pro_referral_url!!}
                          className="text-xs text-muted-foreground whitespace-nowrap shrink-0 group/arrow"
                        >
                          Open{" "}
                          <span className="inline-block transition-transform duration-200 group-hover:translate-x-[2px]">
                            →
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        )
      default:
        return null
    }
  }

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
        {renderContent()}
      </div>
    </motion.div>
  )
}
