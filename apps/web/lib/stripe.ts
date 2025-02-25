import Stripe from "stripe"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { Database } from "@/types/supabase"

type Plan = Database["public"]["Tables"]["plans"]["Row"]

const stripeSecretKey =
  process.env.NODE_ENV === "development"
    ? process.env.STRIPE_SECRET_KEY_TEST
    : process.env.STRIPE_SECRET_KEY_LIVE

if (!stripeSecretKey) {
  throw new Error("Stripe secret key is not set")
}

const stripe = new Stripe(stripeSecretKey)

// Cache for plans
let plansCache: Plan[] | null = null
let lastCacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Fetches all plans from the plans table in Supabase
export async function getAllPlans(forceRefresh = false): Promise<Plan[]> {
  const currentTime = Date.now()

  if (
    !forceRefresh &&
    plansCache !== null &&
    currentTime - lastCacheTime < CACHE_TTL
  ) {
    return plansCache
  }

  const environment = process.env.NODE_ENV === "development" ? "test" : "live"

  const { data, error } = await supabaseWithAdminAccess
    .from("plans")
    .select("*")
    .eq("env", environment)

  if (error) {
    console.error("Error fetching plans:", error)
    throw new Error(`Failed to fetch plans: ${error.message}`)
  }

  plansCache = data || []
  lastCacheTime = currentTime

  return plansCache
}

// Gets a Stripe price ID for a subscription plan
export async function getIdBySubscriptionPlanDetails(
  type: string,
  period: string,
): Promise<string> {
  const plans = await getAllPlans()
  const environment = process.env.NODE_ENV === "development" ? "test" : "live"

  const plan = plans.find(
    (p) => p.type === type && p.period === period && p.env === environment,
  )

  if (!plan) {
    throw new Error(`No plan found for type: ${type} and period: ${period}`)
  }

  return plan.stripe_plan_id
}

export default stripe
