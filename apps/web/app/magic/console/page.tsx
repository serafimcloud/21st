import { auth } from "@clerk/nextjs/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { ConsoleClient } from "./page.client"
import { PlanInfo } from "@/app/settings/billing/page"
import { PLAN_LIMITS, PlanType } from "@/lib/config/subscription-plans"
import { Logo } from "@/components/ui/logo"
import { Footer } from "@/components/ui/footer"
import { Header } from "@/components/ui/header.client"
import { ApiKey } from "@/types/global"
import { redirect } from "next/navigation"

/**
 * Gets current plan information for the user
 */
async function getCurrentPlan(userId: string | null): Promise<PlanInfo> {
  // Default plan data
  const defaultPlanInfo: PlanInfo = {
    name: PLAN_LIMITS.free.displayName,
    type: "free",
    usage: 0,
    limit: PLAN_LIMITS.free.generationsPerMonth,
    current_period_end: undefined,
    cancel_at_period_end: false,
    portal_url: undefined,
  }

  if (!userId) {
    return defaultPlanInfo
  }

  try {
    // 1. Get active user subscription
    const { data: userPlan, error: planError } = await supabaseWithAdminAccess
      .from("users_to_plans")
      .select(
        `
        id,
        status,
        plan_id,
        meta,
        last_paid_at,
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

    // 2. Get usage information
    const { data: usageData, error: usageError } = await supabaseWithAdminAccess
      .from("usages")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    // If there was an error fetching plan, return default plan
    if (planError) {
      console.error("Error fetching plan:", planError)
      return defaultPlanInfo
    }

    // If no active plan, return free plan
    if (!userPlan) {
      return {
        ...defaultPlanInfo,
        // If usage data exists, use it
        usage: usageData?.usage || 0,
        limit: usageData?.limit || PLAN_LIMITS.free.generationsPerMonth,
      }
    }

    // Get plan information
    const plansData = userPlan.plans as any
    const planType = (plansData?.type || "free") as PlanType

    // Data from meta
    const meta = (userPlan.meta as Record<string, any>) || {}

    // Determine usage limit
    // 1. First check if there's a specific limit in usages table
    // 2. If not, use plan limit + add_usage
    // 3. If nothing defined, use default limit for plan type
    const planLimit =
      usageData?.limit ||
      PLAN_LIMITS[planType].generationsPerMonth + (plansData?.add_usage || 0) ||
      PLAN_LIMITS[planType].generationsPerMonth

    // Prepare plan information
    const planInfo: PlanInfo = {
      id: userPlan.id.toString(),
      name:
        PLAN_LIMITS[planType]?.displayName ||
        plansData?.stripe_plan_id ||
        defaultPlanInfo.name,
      type: planType,
      period: plansData?.period || null,
      periodEnd: meta?.period_end || null,
      current_period_end: meta?.current_period_end || null,
      cancel_at_period_end: meta?.cancel_at_period_end || false,
      usage: usageData?.usage || 0,
      limit: planLimit,
      portal_url: meta?.portal_url || null,
      stripe_subscription_id: meta?.stripe_subscription_id || null,
      planData: plansData
        ? {
            id: plansData.id,
            stripe_plan_id: plansData.stripe_plan_id,
            price: plansData.price,
            env: plansData.env,
            period: plansData.period,
            type: plansData.type,
            add_usage: plansData.add_usage,
          }
        : undefined,
    }

    return planInfo
  } catch (error) {
    console.error("Unexpected error fetching plan:", error)
    return defaultPlanInfo
  }
}

/**
 * Gets the API key for the user
 */
async function getApiKey(userId: string | null): Promise<ApiKey | null> {
  if (!userId) return null

  try {
    const { data: rawApiKey } = await supabaseWithAdminAccess
      .from("api_keys")
      .select("*")
      .eq("user_id", userId)
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
      is_active: rawApiKey.is_active || true,
      project_url: rawApiKey.project_url || "",
    }
  } catch (error) {
    console.error("Error fetching API key:", error)
    return null
  }
}

// Always fetch fresh data on page load
export const dynamic = "force-dynamic"

export default async function ConsolePage() {
  const { userId } = await auth()

  // Redirect unauthorized users to onboarding
  if (!userId) {
    redirect("/magic/onboarding")
  }

  const subscription = await getCurrentPlan(userId)
  const apiKey = await getApiKey(userId)

  return (
    <div className="min-h-screen">
      <div className="min-h-screen flex flex-col">
        <Logo className="z-50" />
        <Header />
        <div className="flex-1 mt-[11vh] max-w-[640px] mx-auto w-full px-4">
          <ConsoleClient subscription={subscription} apiKey={apiKey} />
        </div>
        <Footer />
      </div>
    </div>
  )
}
