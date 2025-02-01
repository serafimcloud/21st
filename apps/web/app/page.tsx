import React from "react"
import { Metadata } from "next"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

import { SortOption, DemoWithComponent } from "@/types/global"
import { sections } from "@/lib/navigation"

import { supabaseWithAdminAccess } from "@/lib/supabase"
import { transformDemoResult } from "@/lib/utils/transformData"

import { Header } from "@/components/ui/header.client"
import { HeroSection } from "@/components/ui/hero-section"
import { NewsletterDialog } from "@/components/ui/newsletter-dialog"
import { HomePageClient } from "./page.client"

export const dynamic = "force-dynamic"

export const generateMetadata = async (): Promise<Metadata> => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "21st.dev - The NPM for Design Engineers",
    description:
      "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui. Built by design engineers, for design engineers.",
    url: process.env.NEXT_PUBLIC_APP_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL}/s/{search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  return {
    title: "21st.dev – The NPM for Design Engineers",
    description:
      "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui. Built by design engineers, for design engineers.",
    keywords: [
      "react components",
      "tailwind css",
      "ui components",
      "design engineers",
      "component library",
      "shadcn ui",
      "publish components",
    ],
    openGraph: {
      title: "21st.dev - The NPM for Design Engineers",
      description:
        "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui. Built by design engineers, for design engineers.",
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "21st.dev - The NPM for Design Engineers",
      description:
        "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui. Built by design engineers, for design engineers.",
      images: [`${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`],
    },
    other: {
      "script:ld+json": JSON.stringify(jsonLd),
    },
  }
}

export default async function HomePage() {
  try {
    const cookieStore = cookies()
    const shouldShowHero = !cookieStore.has("has_visited")
    const savedSortBy = cookieStore.get("saved_sort_by")?.value as
      | SortOption
      | undefined

    const defaultSortBy: SortOption = "recommended"
    const sortByPreference: SortOption = savedSortBy || defaultSortBy

    // Собираем все ID демо из навигации
    const allDemoIds = sections
      .flatMap((section) => section.items.map((item) => item.demoId))
      .filter((id): id is number => id !== undefined)

    // Получаем превью для секций
    const { data: sectionPreviews } = await supabaseWithAdminAccess
      .rpc("get_section_previews", {
        p_demo_ids: allDemoIds,
      })
      .throwOnError()

    if (shouldShowHero) {
      return (
        <>
          <HeroSection />
          <NewsletterDialog />
        </>
      )
    }

    return (
      <>
        <Header variant="default" />
        <HomePageClient initialSections={sectionPreviews || []} />
        <NewsletterDialog />
      </>
    )
  } catch (error) {
    console.error("Error in home page:", error)
    redirect("/")
  }
}
