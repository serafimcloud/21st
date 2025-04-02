import { StudioClient } from "./page.client"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { Footer } from "@/components/ui/footer"
import { unstable_cache } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

const getCachedUserComponents = unstable_cache(
  async (userId: string) => {
    const { data: components } = await supabaseWithAdminAccess
      .from("components")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    return components || []
  },
  ["user-components"],
  {
    revalidate: 30,
    tags: ["user-components"],
  },
)

export const metadata = {
  title: "Studio | 21st.dev - The NPM for Design Engineers",
  description: "Manage and publish your components on 21st.dev",
}

export default async function StudioPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const components = await getCachedUserComponents(userId)

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <StudioClient initialComponents={components} />
      </div>
      <Footer />
    </div>
  )
}
