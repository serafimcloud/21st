import { supabaseWithAdminAccess } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import Stripe from "stripe"

type Plan = Database["public"]["Tables"]["plans"]["Row"]

const stripeSecretKeyV1 = process.env.STRIPE_SECRET_KEY_V1
const stripeSecretKeyV2 = process.env.STRIPE_SECRET_KEY_V2

if (!stripeSecretKeyV1 || !stripeSecretKeyV2) {
  throw new Error("Stripe secret key is not set")
}

export const stripeV1 = new Stripe(stripeSecretKeyV1)
export const stripeV2 = new Stripe(stripeSecretKeyV2)

function createFallbackProxy(primary: any, fallback: any): any {
  return new Proxy(
    {},
    {
      get(_, prop) {
        const primaryValue = primary[prop]
        const fallbackValue = fallback[prop]

        // If the property is a function, return a function that wraps calls.
        if (
          typeof primaryValue === "function" ||
          typeof fallbackValue === "function"
        ) {
          return async (...args: any[]) => {
            if (typeof primaryValue === "function") {
              try {
                return await primaryValue.apply(primary, args)
              } catch (error) {
                console.error(
                  `Primary method ${String(prop)} failed, falling back`,
                  error,
                )
                if (typeof fallbackValue === "function") {
                  return await fallbackValue.apply(fallback, args)
                }
                throw error
              }
            } else if (typeof fallbackValue === "function") {
              return await fallbackValue.apply(fallback, args)
            }
          }
        }
        // If it's an object, recursively wrap it.
        if (primaryValue && typeof primaryValue === "object") {
          return createFallbackProxy(primaryValue, fallbackValue || {})
        }
        // Return primary if exists; otherwise fallback.
        return primaryValue !== undefined ? primaryValue : fallbackValue
      },
    },
  )
}

/**
 * The exported `stripe` variable acts like a regular Stripe instance.
 * Under the hood, it calls methods on stripeV2 first.
 * If the call fails, it falls back to stripeV1.
 *
 * For example:
 *   stripe.subscriptions.retrieve(subscriptionId)
 */
const stripe = createFallbackProxy(stripeV2, stripeV1) as Stripe
export default stripe

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

  const environment = "live"
  const { data, error } = await supabaseWithAdminAccess
    .from("plans")
    .select("*")
    .eq("env", environment)
    .order("created_at", { ascending: false })

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
  version: 1 | 2,
): Promise<string> {
  const plans = await getAllPlans()
  const environment = "live"

  const plan = plans.find(
    (p) =>
      p.type === type &&
      p.period === period &&
      p.env === environment &&
      p.version === version,
  )

  if (!plan) {
    throw new Error(`No plan found for type: ${type} and period: ${period}`)
  }

  // Ensure stripe_plan_id is not null before returning
  if (!plan.stripe_plan_id) {
    throw new Error(
      `Plan found but has no Stripe ID for type: ${type} and period: ${period}`,
    )
  }

  return plan.stripe_plan_id
}

export const getStripeId = async (userId: string): Promise<string> => {
  const { data: userData, error: userError } = await supabaseWithAdminAccess
    .from("users")
    .select("stripe_id, display_username, username, email")
    .eq("id", userId)
    .single()

  if (userError) {
    throw new Error(userError.message)
  }

  let stripeId = userData?.stripe_id
  if (!stripeId) {
    const account = await stripe.accounts.create({
      email: userData.email,
      business_profile: {
        url: `https://21st.dev/${userData?.display_username ?? userData?.username}`,
        product_description:
          "Sell UI components (source code) for web developers",
      },
      controller: {
        stripe_dashboard: {
          type: "express",
        },
        fees: {
          payer: "application",
        },
        losses: {
          payments: "application",
        },
      },
      // tos_acceptance: {
      //   service_agreement: "recipient",
      // },
    })

    const { error: updateError } = await supabaseWithAdminAccess
      .from("users")
      .update({
        stripe_id: account.id,
      })
      .eq("id", userId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    stripeId = account.id
  }

  return stripeId
}
