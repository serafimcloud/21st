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
        urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL}/q/{search_term_string}`,
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
          <Logo />
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
