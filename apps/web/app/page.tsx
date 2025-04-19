import React from "react"
import { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { Header } from "@/components/ui/header.client"
import { Footer } from "@/components/ui/footer"
import { HeroSection } from "@/components/ui/hero-section"
import { NewsletterDialog } from "@/components/ui/newsletter-dialog"
import { HomePageClient } from "./page.client"
import { Logo } from "@/components/ui/logo"
import { SITE_NAME, SITE_SLOGAN, BASE_KEYWORDS } from "@/lib/constants"
export const dynamic = "force-dynamic"

export const generateMetadata = async (): Promise<Metadata> => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: `${SITE_NAME} - ${SITE_SLOGAN}`,
    description:
      "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui.",
    url: process.env.NEXT_PUBLIC_APP_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL}/q/{search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    keywords: BASE_KEYWORDS,
  }

  return {
    title: `${SITE_NAME} – ${SITE_SLOGAN}`,
    description:
      "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui.",
    keywords: [...BASE_KEYWORDS],
    openGraph: {
      title: `${SITE_NAME} - ${SITE_SLOGAN}`,
      description:
        "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui.",
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
      title: `${SITE_NAME} - ${SITE_SLOGAN}`,
      description:
        "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui.",
      images: [`${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`],
    },
    other: {
      "script:ld+json": JSON.stringify(jsonLd),
    },
  }
}

export default async function HomePage() {
  try {
    const cookieStore = await cookies()
    const shouldShowHero = !cookieStore.has("has_visited")

    if (shouldShowHero) {
      return (
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">
            <HeroSection />
            <NewsletterDialog />
          </div>
          <Footer />
        </div>
      )
    }

    return (
      <div className="min-h-screen flex flex-col">
        <Header variant="default" />
        <div className="flex-1">
          <Logo className="z-50" />
          <HomePageClient />
          <NewsletterDialog />
        </div>
        <Footer />
      </div>
    )
  } catch (error) {
    console.error("Error in home page:", error)
    redirect("/")
  }
}
