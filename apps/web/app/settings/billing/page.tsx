import { auth } from "@clerk/nextjs/server"
import { BillingSettingsClient } from "@/app/settings/billing/page.client"
import { PLAN_LIMITS, PlanType } from "@/lib/config/subscription-plans"
import { supabaseWithAdminAccess } from "@/lib/supabase"

// Define type for subscription data
interface PlanInfo {
  id?: string
  name: string
  type: "free" | "standard" | "pro"
  period?: string | null
  periodEnd?: string | null
  usage_count?: number
  current_period_end?: string
  cancel_at_period_end?: boolean
  portal_url?: string
  stripe_subscription_id?: string
}

interface PlanData {
  name: string
  type: "free" | "standard" | "pro"
  period?: string | null
}

interface UserPlanData {
  status: string
  plan?: PlanData
  meta?: Record<string, any>
  plans?: {
    id: number
    stripe_plan_id: string
    price: number
    env: string
    period: string
    type: string
    add_usage: number
  }
}

async function getCurrentPlan(userId: string | null): Promise<PlanInfo> {
  // Default data to return in case of an error
  const defaultPlanInfo: PlanInfo = {
    name: PLAN_LIMITS.free.displayName,
    type: "free",
    usage_count: 0,
    current_period_end: undefined,
    cancel_at_period_end: false,
    portal_url: undefined,
  }

  if (!userId) {
    console.log("[Billing] No userId provided, returning free plan")
    return defaultPlanInfo
  }

  console.log(`[Billing] Fetching subscription for user: ${userId}`)

  try {
    console.log(`[Billing] Querying users_to_plans for userId: ${userId}`)

    // Get subscription information directly from the database
    const { data: userPlan, error } = await supabaseWithAdminAccess
      .from("users_to_plans")
      .select(
        `
        id,
        status,
        plan_id,
        meta,
        plans:plan_id (
          id,
          stripe_plan_id,
          price,
          env,
          period,
          type,
          add_usage
        )
      `,
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle()

    // Log raw response for debugging
    console.log("[Billing] Supabase query result:", { data: userPlan, error })

    // If no data or error occurred, return default plan (Free)
    if (error) {
      console.error("[Billing] Error fetching plan data:", error)
      return defaultPlanInfo
    }

    if (!userPlan) {
      console.log(
        "[Billing] User has no active subscription, returning free plan",
      )

      // Additional query to check if user has any plans (including non-active)
      const { data: allUserPlans, error: allPlansError } =
        await supabaseWithAdminAccess
          .from("users_to_plans")
          .select("id, status, plan_id")
          .eq("user_id", userId)

      console.log("[Billing] All user plans:", {
        data: allUserPlans,
        error: allPlansError,
      })

      return defaultPlanInfo
    }

    // Type the obtained data
    const typedUserPlan = userPlan as unknown as UserPlanData
    console.log(
      "[Billing] User plan data:",
      JSON.stringify(typedUserPlan, null, 2),
    )

    // Get usage statistics (if available)
    const usageCount = typedUserPlan.meta?.usage_count || 0

    // Define Stripe portal URL (if available)
    let portalUrl = typedUserPlan.meta?.portal_url || null

    // Check plan type from database
    const plansData = Array.isArray(typedUserPlan.plans)
      ? typedUserPlan.plans[0]
      : typedUserPlan.plans
    const planType = plansData?.type as PlanType
    console.log(`[Billing] Plan type from DB: ${planType}`)

    if (!planType || !plansData) {
      console.warn("[Billing] Plan type or plans object is undefined/null")
      console.log(
        "[Billing] typedUserPlan:",
        JSON.stringify(typedUserPlan, null, 2),
      )
      return defaultPlanInfo
    }

    // Get usage data
    const { data: usageData, error: usageError } = await supabaseWithAdminAccess
      .from("usages")
      .select("usage")
      .eq("user_id", userId)
      .single()

    console.log("[Billing] User usage data:", usageData, "Error:", usageError)

    // Use value from usages table or 0 if no data
    const actualUsageCount = usageData?.usage || 0

    // Prepare plan information
    const planInfo: PlanInfo = {
      ...defaultPlanInfo,
      name:
        PLAN_LIMITS[planType]?.displayName ||
        plansData.stripe_plan_id ||
        defaultPlanInfo.name,
      type: planType && PLAN_LIMITS[planType] ? planType : "free",
      period: plansData.period || null,
      periodEnd: typedUserPlan.meta?.period_end || null,
      current_period_end: typedUserPlan.meta?.current_period_end || null,
      cancel_at_period_end: typedUserPlan.meta?.cancel_at_period_end || false,
      usage_count: actualUsageCount,
      portal_url: portalUrl,
      stripe_subscription_id:
        typedUserPlan.meta?.stripe_subscription_id || null,
    }

    console.log(
      "[Billing] Returning plan info:",
      JSON.stringify(planInfo, null, 2),
    )
    return planInfo
  } catch (error) {
    console.error("[Billing] Unexpected error fetching plan data:", error)
    return defaultPlanInfo
  }
}

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

// Always fetch fresh data on page load
export const dynamic = "force-dynamic"

export default async function BillingSettingsPage({ searchParams }: PageProps) {
  const { userId } = await auth()
  console.log(`[Billing Page] Processing request for userId: ${userId}`)

  // Get subscription data
  const subscription = await getCurrentPlan(userId)
  console.log(`[Billing Page] Got subscription: ${subscription.type}`)

  // Await searchParams before accessing properties
  const success = (await searchParams)?.success === "true"
  const canceled = (await searchParams)?.canceled === "true"

  return (
    <div className="container pb-4 px-0">
      <div className="space-y-6">
        {/* Client Component with subscription data */}
        <BillingSettingsClient
          subscription={subscription}
          successParam={success}
          canceledParam={canceled}
        />
      </div>
    </div>
  )
}
