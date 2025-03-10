import Stripe from "stripe"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { Database } from "@/types/supabase"

type Plan = Database["public"]["Tables"]["plans"]["Row"]

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

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

// Get a plan directly by its Stripe plan ID
export async function getPlanByStripeId(stripePlanId: string): Promise<Plan> {
  try {
    // Try to use cached data first
    const plans = await getAllPlans()
    const cachedPlan = plans.find(
      (plan) => plan.stripe_plan_id === stripePlanId,
    )

    if (cachedPlan) {
      return cachedPlan
    }

    // If not found in cache, make a direct request
    const { data, error } = await supabaseWithAdminAccess
      .from("plans")
      .select("*")
      .eq("stripe_plan_id", stripePlanId)
      .single()

    if (error) {
      console.error("Error fetching plan by Stripe ID:", error)
      throw new Error(`No plan found with ID: ${stripePlanId}`)
    }

    return data
  } catch (error) {
    console.error("Error in getPlanByStripeId:", error)
    throw new Error(`Failed to find plan with ID: ${stripePlanId}`)
  }
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

  // Ensure stripe_plan_id is not null before returning
  if (!plan.stripe_plan_id) {
    throw new Error(`Plan found but has no Stripe ID for type: ${type} and period: ${period}`)
  }

  return plan.stripe_plan_id
}

export default stripe
