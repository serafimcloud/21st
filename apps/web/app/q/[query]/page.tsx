import React from "react"
import { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SortOption } from "@/types/global"
import { Header } from "@/components/ui/header.client"
import { NewsletterDialog } from "@/components/ui/newsletter-dialog"
import { SearchPageClient } from "@/app/q/[query]/page.client"

export const dynamic = "force-dynamic"

type Props = {
  params: {
    query: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const decodedQuery = decodeURIComponent(params.query)

  return {
    title: `Search results for "${decodedQuery}" - 21st.dev`,
    description: `Find React Tailwind components matching "${decodedQuery}" on 21st.dev`,
    robots: {
      index: false,
      follow: true,
    },
  }
}

export default async function SearchPage({ params }: Props) {
  try {
    const cookieStore = cookies()
    const savedSortBy = cookieStore.get("saved_sort_by")?.value as
      | SortOption
      | undefined
    const defaultSortBy: SortOption = "recommended"
    const sortByPreference: SortOption = savedSortBy || defaultSortBy
    const decodedQuery = decodeURIComponent(params.query)

    return (
      <>
        <Header variant="default" />
        <SearchPageClient
          initialQuery={decodedQuery}
          initialSortBy={sortByPreference}
        />
        <NewsletterDialog />
      </>
    )
  } catch (error) {
    console.error("Error in search page:", error)
    redirect("/")
  }
}
