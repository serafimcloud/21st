import { auth } from "@clerk/nextjs/server"
import { BillingSettingsClient } from "@/app/settings/billing/page.client"
import { PLAN_LIMITS, PlanType } from "@/lib/config/subscription-plans"
import { supabaseWithAdminAccess } from "@/lib/supabase"

export interface PlanInfo {
  id?: string
  name: string
  type: PlanType
  period?: string | null
  periodEnd?: string | null
  current_period_end?: string
  cancel_at_period_end?: boolean
  portal_url?: string
  stripe_subscription_id?: string
  usage: number
  limit: number
  planData?: {
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

    const { data: usageData, error: usageError } = await supabaseWithAdminAccess
      .from("usages")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (planError) {
      console.error("Error fetching plan:", planError)
      return defaultPlanInfo
    }

    if (!userPlan) {
      return {
        ...defaultPlanInfo,
        usage: usageData?.usage || 0,
        limit: usageData?.limit || PLAN_LIMITS.free.generationsPerMonth,
      }
    }

    const plansData = userPlan.plans as any
    const planType = (plansData?.type || "free") as PlanType

    const meta = (userPlan.meta as Record<string, any>) || {}

    const planLimit =
      usageData?.limit ||
      PLAN_LIMITS[planType].generationsPerMonth + (plansData?.add_usage || 0) ||
      PLAN_LIMITS[planType].generationsPerMonth

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

  const subscription = await getCurrentPlan(userId)

  const success = resolvedSearchParams?.success === "true"
  const canceled = resolvedSearchParams?.canceled === "true"

  return (
    <div className="container pb-4 px-0">
      <div className="space-y-6">
        <BillingSettingsClient
          subscription={subscription}
          successParam={success}
          canceledParam={canceled}
        />
      </div>
    </div>
  )
}
