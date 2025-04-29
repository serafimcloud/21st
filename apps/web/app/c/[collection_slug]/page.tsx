import { Metadata } from "next"
import { redirect } from "next/navigation"

import { Header } from "@/components/ui/header.client"
import { Footer } from "@/components/ui/footer"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { CollectionPageContent } from "./page.client"
import { SortOption, User } from "@/types/global"
import { cookies } from "next/headers"
import { validateRouteParams } from "@/lib/utils/validateRouteParams"
import { unstable_cache } from "next/cache"
import { Logo } from "@/components/ui/logo"
import { SITE_NAME, SITE_SLOGAN, BASE_KEYWORDS } from "@/lib/constants"

interface CollectionPageProps {
  params: Promise<{
    collection_slug: string
  }>
}

const getCachedCollectionInfo = unstable_cache(
  async (collectionSlug: string) => {
    const { data, error } = await supabaseWithAdminAccess
      .from("collections")
      .select(
        `
        *,
        user_data:users(*),
        components_count:components_to_collections(count)
      `,
      )
      .eq("slug", collectionSlug)
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      return null
    }

    return {
      ...data,
      user_data: data.user_data as User,
      components_count: data.components_count?.[0]?.count || 0,
    }
  },
  ["collection-info"],
  {
    revalidate: 30, // Cache for 30 seconds
    tags: ["collection-info"],
  },
)

async function getCollectionInfo(collectionSlug: string) {
  return getCachedCollectionInfo(collectionSlug)
}

export default async function CollectionPage(props: CollectionPageProps) {
  const params = await props.params
  if (!validateRouteParams(params)) {
    redirect("/")
  }

  const cookieStore = await cookies()
  const collectionSlug = params.collection_slug

  try {
    const collectionInfo = await getCollectionInfo(collectionSlug)
    if (!collectionInfo) {
      redirect("/")
    }

    console.log("[CollectionPage] Collection info:", {
      id: collectionInfo.id,
      name: collectionInfo.name,
      slug: collectionInfo.slug,
    })

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
          <CollectionPageContent
            initialSortBy={sortByPreference}
            collection={collectionInfo}
          />
        </div>
        <Footer />
      </div>
    )
  } catch (error) {
    console.error("Error in collection page:", error)
    redirect("/")
  }
}

export async function generateMetadata(
  props: CollectionPageProps,
): Promise<Metadata> {
  const params = await props.params
  try {
    const collectionInfo = await getCollectionInfo(params.collection_slug)
    if (!collectionInfo) {
      redirect("/")
    }

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${collectionInfo.name} | ${SITE_NAME} - ${SITE_SLOGAN}`,
      description:
        collectionInfo.description ||
        `A collection of React components by ${collectionInfo.user_data.name}`,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/c/${params.collection_slug}`,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: `${collectionInfo.name} React components collection`,
      },
    }

    return {
      title: `${collectionInfo.name} | ${SITE_NAME} - ${SITE_SLOGAN}`,
      description:
        collectionInfo.description ||
        `A collection of React components by ${collectionInfo.user_data.name}`,
      openGraph: {
        title: `${collectionInfo.name} | ${SITE_NAME} - ${SITE_SLOGAN}`,
        description:
          collectionInfo.description ||
          `A collection of React components by ${collectionInfo.user_data.name}`,
      },
      keywords: [...BASE_KEYWORDS, collectionInfo.name],
      other: {
        "script:ld+json": JSON.stringify(jsonLd),
      },
    }
  } catch (error) {
    redirect("/")
  }
}
