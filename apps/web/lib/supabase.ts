import { Database } from "@/types/supabase"
import {
  createClient,
  PostgrestError,
  SupabaseClient,
} from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabaseWithAdminAccess: SupabaseClient<Database> =
  createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

export const checkIsAdmin = async (
  userId: string,
): Promise<
  { isAdmin: boolean; error: null } | { isAdmin: false; error: PostgrestError }
> => {
  const { data: currentUser, error: currentUserError } =
    await supabaseWithAdminAccess
      .from("users")
      .select("is_admin")
      .eq("id", userId)
      .single()

  if (currentUserError) {
    return { isAdmin: false, error: currentUserError }
  }

  return { isAdmin: currentUser?.is_admin ?? false, error: null }
}
