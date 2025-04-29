import React from "react"
import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { TemplatesListSEO } from "@/components/features/templates/templates-list-seo"
import { BASE_KEYWORDS, SITE_NAME, SITE_SLOGAN } from "@/lib/constants"

export const metadata: Metadata = {
  title: `shadcn/ui Templates Collection | ${SITE_NAME} - ${SITE_SLOGAN}`,
  description:
    "Collection of crafted website templates built with shadcn/ui components, Framer Motion animations and Tailwind CSS by design engineers.",
  openGraph: {
    title: `shadcn/ui Templates Collection | ${SITE_NAME} - ${SITE_SLOGAN}`,
    description:
      "Collection of crafted website templates built with shadcn/ui components, Framer Motion animations and Tailwind CSS by design engineers.",
    type: "website",
  },
  keywords: [
    ...BASE_KEYWORDS,
    "website templates",
    "shadcn templates",
    "shadcn/ui templates",
    "shadcn/ui",
    "Framer Motion",
    "Tailwind CSS",
    "React components"],
}

export default function TemplatesPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft size={20} />
        <span>Back to 21st.dev</span>
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">shadcn/ui Templates</h1>
        <p className="text-xl text-muted-foreground">
          Collection of crafted website templates built with shadcn/ui
          components, Framer Motion animations and Tailwind CSS by design
          engineers.
        </p>
      </div>
      <TemplatesListSEO />
    </div>
  )
}
