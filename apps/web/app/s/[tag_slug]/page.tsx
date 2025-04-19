import { Metadata } from "next"
import { redirect } from "next/navigation"

import { Header } from "@/components/ui/header.client"
import { Footer } from "@/components/ui/footer"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { TagPageContent } from "./page.client"
import { SortOption } from "@/types/global"
import { cookies } from "next/headers"
import { validateRouteParams } from "@/lib/utils/validateRouteParams"
import { unstable_cache } from "next/cache"
import { Logo } from "@/components/ui/logo"
import { BASE_KEYWORDS, SITE_NAME, SITE_SLOGAN } from "@/lib/constants"

interface TagPageProps {
  params: Promise<{
    tag_slug: string
  }>
}

const getCachedTagInfo = unstable_cache(
  async (tagSlug: string) => {
    const { data, error } = await supabaseWithAdminAccess
      .from("tags")
      .select("*")
      .eq("slug", tagSlug)
      .single()

    if (error) {
      throw error
    }

    return data
  },
  ["tag-info"],
  {
    revalidate: 30, // Cache for 30 seconds
    tags: ["tag-info"],
  },
)

async function getTagInfo(tagSlug: string) {
  return getCachedTagInfo(tagSlug)
}

export default async function TagPage(props: TagPageProps) {
  const params = await props.params
  if (!validateRouteParams(params)) {
    redirect("/")
  }

  const cookieStore = await cookies()
  const tagSlug = params.tag_slug

  try {
    const tagInfo = await getTagInfo(tagSlug)
    if (!tagInfo) {
      redirect("/")
    }

    const savedSortBy = cookieStore.get("saved_sort_by")?.value as
      | SortOption
      | undefined

    const defaultSortBy: SortOption = "recommended"
    const sortByPreference: SortOption = savedSortBy?.length
      ? (savedSortBy as SortOption)
      : defaultSortBy

    return (
      <div className="min-h-screen flex flex-col">
        <Logo className="z-50" />
        <Header />
        <div className="flex-1">
          <TagPageContent
            tagName={tagInfo.name}
            tagSlug={tagSlug}
            initialSortBy={sortByPreference}
          />
        </div>
        <Footer />
      </div>
    )
  } catch (error) {
    console.error("Error in tag page:", error)
    redirect("/")
  }
}

export async function generateMetadata(props: TagPageProps): Promise<Metadata> {
  const params = await props.params
  try {
    const tagInfo = await getTagInfo(params.tag_slug)
    if (!tagInfo) {
      redirect("/")
    }

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${tagInfo.name} Components | ${SITE_NAME} - ${SITE_SLOGAN}`,
      description: `Ready-to-use ${tagInfo.name.toLowerCase()} React components inspired by shadcn/ui.`,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/s/${params.tag_slug}`,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: `${tagInfo.name} React components`,
      },
    }

    return {
      title: `${tagInfo.name} Components | ${SITE_NAME} - ${SITE_SLOGAN}`,
      description: `Discover and share ${tagInfo.name.toLowerCase()} components. Ready-to-use React Tailwind components inspired by shadcn/ui.`,
      openGraph: {
          title: `${tagInfo.name} Components | ${SITE_NAME} - ${SITE_SLOGAN}`,
        description: `Ready-to-use ${tagInfo.name.toLowerCase()} React Tailwind components inspired by shadcn/ui.`,
      },
      keywords: [
        `${tagInfo.name.toLowerCase()} components`,
        `${tagInfo.name.toLowerCase()} shadcn/ui`,
        `${tagInfo.name.toLowerCase()}`,
        ...BASE_KEYWORDS,
      ],
      other: {  
        "script:ld+json": JSON.stringify(jsonLd),
      },
    }
  } catch (error) {
    redirect("/")
  }
}
