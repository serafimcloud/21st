import React from "react"
import { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SortOption } from "@/types/global"
import { Header } from "@/components/ui/header.client"
import { Footer } from "@/components/ui/footer"
import { NewsletterDialog } from "@/components/ui/newsletter-dialog"
import { SearchPageClient } from "@/app/q/[query]/page.client"
import { Logo } from "@/components/ui/logo"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{
    query: string
  }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
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

export default async function SearchPage(props: Props) {
  const params = await props.params
  try {
    const cookieStore = await cookies()
    const savedSortBy = cookieStore.get("saved_sort_by")?.value as
      | SortOption
      | undefined
    const defaultSortBy: SortOption = "recommended"
    const sortByPreference: SortOption = savedSortBy || defaultSortBy
    const decodedQuery = decodeURIComponent(params.query)

    return (
      <div className="min-h-screen flex flex-col">
        <Logo className="z-50" />
        <Header variant="default" />
        <div className="flex-1">
          <SearchPageClient
            initialQuery={decodedQuery}
            initialSortBy={sortByPreference}
          />
          <NewsletterDialog />
        </div>
        <Footer />
      </div>
    )
  } catch (error) {
    console.error("Error in search page:", error)
    redirect("/")
  }
}
