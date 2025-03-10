import { auth } from "@clerk/nextjs/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { OnboardingClient } from "./page.client"

async function getApiKey(userId: string) {
  const supabase = supabaseWithAdminAccess
  const { data: rawApiKey } = await supabase
    .from("api_keys")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single()

  if (!rawApiKey) return null

  return {
    id: rawApiKey.id,
    key: rawApiKey.key,
    user_id: rawApiKey.user_id,
    plan: rawApiKey.plan || "free",
    requests_limit: rawApiKey.requests_limit || 100,
    requests_count: rawApiKey.requests_count || 0,
    created_at: rawApiKey.created_at || new Date().toISOString(),
    expires_at: rawApiKey.expires_at,
    last_used_at: rawApiKey.last_used_at,
    is_active: rawApiKey.is_active ?? true,
    project_url: rawApiKey.project_url || "https://21st.dev/magic",
  }
}

export default async function OnboardingPage() {
  const { userId } = await auth()
  const apiKey = userId ? await getApiKey(userId) : null

  return (
    <div className="min-h-screen flex flex-col">
        <OnboardingClient initialApiKey={apiKey} userId={userId} />
 
    </div>
  )
}
