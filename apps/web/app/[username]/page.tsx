import { Footer } from "@/components/ui/footer"
import { BASE_KEYWORDS, SITE_NAME, SITE_SLOGAN } from "@/lib/constants"
import { getUserData } from "@/lib/queries"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { validateRouteParams } from "@/lib/utils/validateRouteParams"
import { unstable_cache } from "next/cache"
import { redirect } from "next/navigation"
import { UserPageClient } from "./page.client"
const getCachedUser = unstable_cache(
  async (username: string) => {
    const { data: user } = await getUserData(supabaseWithAdminAccess, username)
    return user
  },
  ["user-data"],
  {
    revalidate: 30, // Cache for 30 seconds
    tags: ["user-data"],
  },
)

async function getUser(username: string) {
  return getCachedUser(username)
}

export const generateMetadata = async (props: {
  params: Promise<{ username: string }>
}) => {
  const params = await props.params
  const user = await getUser(params.username)

  if (!user) {
    return {
      title: "User Not Found",
    }
  }

  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${user.display_username || user.username}/opengraph-image`

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ),
    title: `${user.display_name || user.name || user.username} | ${SITE_NAME} - ${SITE_SLOGAN}`,
    description: `Collection of free open source shadcn/ui React Tailwind components by ${user.display_name || user.name || user.username}.`,
    openGraph: {
      title: `${user.display_name || user.name || user.username}'s Components | ${SITE_NAME} - ${SITE_SLOGAN}`,
      description: `Browse ${user.display_name || user.name || user.username}'s collection of React Tailwind components inspired by shadcn/ui.`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${user.display_name || user.name || user.username}'s profile`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${user.display_name || user.name || user.username}'s Components | ${SITE_NAME} - ${SITE_SLOGAN}`,
      description: `Browse ${user.display_name || user.name || user.username}'s collection of React Tailwind components inspired by shadcn/ui.`,
      images: [ogImageUrl],
    },
    keywords: [
      ...BASE_KEYWORDS,
      `${user.display_username || user.username} components`,
      `${user.display_username}`,
      `${user.username}`,
    ],
  }
}

export default async function UserProfile(props: {
  params: Promise<{ username: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const searchParams = await props.searchParams
  const params = await props.params
  if (!validateRouteParams(params)) {
    redirect("/")
  }

  const user = await getUser(params.username)

  if (!user || !user.username) {
    redirect("/")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <UserPageClient
          user={user}
          initialTab={searchParams.tab || "components"}
        />
      </div>
      <Footer />
    </div>
  )
}
