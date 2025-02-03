import { Metadata } from "next"
import { redirect } from "next/navigation"
import { SupabaseClient } from "@supabase/supabase-js"

import { Header } from "@/components/ui/header.client"
import { Footer } from "@/components/ui/footer"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { TagPageContent } from "./page.client"
import { SortOption } from "@/types/global"
import { cookies } from "next/headers"
import { validateRouteParams } from "@/lib/utils/validateRouteParams"

interface TagPageProps {
  params: {
    tag_slug: string
  }
}

const getTagInfo = async (
  supabase: SupabaseClient<Database>,
  tagSlug: string,
) => {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("slug", tagSlug)
    .single()

  if (error) {
    throw error
  }

  return data
}

export default async function TagPage({ params }: TagPageProps) {
  if (!validateRouteParams(params)) {
    redirect("/")
  }

  const cookieStore = cookies()
  const tagSlug = params.tag_slug

  try {
    const tagInfo = await getTagInfo(supabaseWithAdminAccess, tagSlug)
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

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  try {
    const tagInfo = await getTagInfo(supabaseWithAdminAccess, params.tag_slug)
    if (!tagInfo) {
      redirect("/")
    }

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${tagInfo.name} Components | 21st.dev - The NPM for Design Engineers`,
      description: `Ready-to-use ${tagInfo.name.toLowerCase()} React components inspired by shadcn/ui.`,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/s/${params.tag_slug}`,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: `${tagInfo.name} React components`,
      },
    }

    return {
      title: `${tagInfo.name} Components | 21st.dev - The NPM for Design Engineers`,
      description: `Discover and share ${tagInfo.name.toLowerCase()} components. Ready-to-use React Tailwind components inspired by shadcn/ui.`,
      openGraph: {
        title: `${tagInfo.name} Components | 21st.dev - The NPM for Design Engineers`,
        description: `Ready-to-use ${tagInfo.name.toLowerCase()} React Tailwind components inspired by shadcn/ui.`,
      },
      keywords: [
        `${tagInfo.name.toLowerCase()} components`,
        "react components",
        "design engineers",
        "component library",
        "tailwind components",
        "ui components",
        `${tagInfo.name.toLowerCase()} shadcn/ui`,
      ],
      other: {
        "script:ld+json": JSON.stringify(jsonLd),
      },
    }
  } catch (error) {
    redirect("/")
  }
}
