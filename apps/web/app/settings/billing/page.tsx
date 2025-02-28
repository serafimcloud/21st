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
    return defaultPlanInfo
  }

  try {
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

    // If no data or error occurred, return default plan (Free)
    if (error) {
      return defaultPlanInfo
    }

    if (!userPlan) {
      // Additional query to check if user has any plans (including non-active)
      await supabaseWithAdminAccess
        .from("users_to_plans")
        .select("id, status, plan_id")
        .eq("user_id", userId)

      return defaultPlanInfo
    }

    // Type the obtained data
    const typedUserPlan = userPlan as unknown as UserPlanData

    // Get usage statistics (if available)
    const usageCount = typedUserPlan.meta?.usage_count || 0

    // Define Stripe portal URL (if available)
    let portalUrl = typedUserPlan.meta?.portal_url || null

    // Check plan type from database
    const plansData = Array.isArray(typedUserPlan.plans)
      ? typedUserPlan.plans[0]
      : typedUserPlan.plans
    const planType = plansData?.type as PlanType

    if (!planType || !plansData) {
      return defaultPlanInfo
    }

    // Get usage data
    const { data: usageData } = await supabaseWithAdminAccess
      .from("usages")
      .select("usage")
      .eq("user_id", userId)
      .single()

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

    return planInfo
  } catch (error) {
    return defaultPlanInfo
  }
}

// Always fetch fresh data on page load
export const dynamic = "force-dynamic"

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined
  }>
}) {
  const resolvedSearchParams = await searchParams
  const { userId } = await auth()

  // Get subscription data
  const subscription = await getCurrentPlan(userId)

  // Access searchParams after resolving the promise
  const success = resolvedSearchParams?.success === "true"
  const canceled = resolvedSearchParams?.canceled === "true"

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
