import { UserPageClient } from "./page.client"
import { getUserData } from "@/lib/queries"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { validateRouteParams } from "@/lib/utils/validateRouteParams"
import { redirect } from "next/navigation"

export const generateMetadata = async ({
  params,
}: {
  params: { username: string }
}) => {
  const { data: user } = await getUserData(
    supabaseWithAdminAccess,
    params.username,
  )

  if (!user) {
    return {
      title: "User Not Found",
    }
  }

  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${user.display_username || user.username}/opengraph-image`

  return {
    metadataBase: new URL("https://21st.dev"),
    title: `${user.display_name || user.name || user.username} | 21st.dev - The NPM for Design Engineers`,
    description: `Collection of free open source shadcn/ui React Tailwind components by ${user.display_name || user.name || user.username}.`,
    openGraph: {
      title: `${user.display_name || user.name || user.username}'s Components | 21st.dev - The NPM for Design Engineers`,
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
      title: `${user.display_name || user.name || user.username}'s Components | 21st.dev - The NPM for Design Engineers`,
      description: `Browse ${user.display_name || user.name || user.username}'s collection of React Tailwind components inspired by shadcn/ui.`,
      images: [ogImageUrl],
    },
    keywords: [
      "react components",
      "tailwind css",
      "ui components",
      "shadcn/ui",
      "shadcn",
      "open source",
      `${user.display_username || user.username} components`,
    ],
  }
}

export default async function UserProfile({
  params,
}: {
  params: { username: string }
}) {
  if (!validateRouteParams(params)) {
    redirect("/")
  }

  const { data: user } = await getUserData(
    supabaseWithAdminAccess,
    params.username,
  )

  if (!user || !user.username) {
    redirect("/")
  }

  return (
    <UserPageClient
      user={user}
      publishedComponents={[]}
      huntedComponents={[]}
      userDemos={[]}
      likedComponents={[]}
      initialTab="published"
    />
  )
}
