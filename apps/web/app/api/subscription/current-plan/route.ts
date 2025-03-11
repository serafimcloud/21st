import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"

interface PlanData {
  name: string
  type: "free" | "pro" | "pro_plus"
  period?: string | null
}

interface UserPlanData {
  status: string
  plans?: PlanData
  meta?: Record<string, any>
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authSession = await auth()
    const userId = authSession?.userId

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Default plan info to return when no other data is available
    const defaultPlanInfo = {
      name: "Free Plan",
      type: "free" as const,
      period: null,
      periodEnd: null,
      usage_count: 0,
      current_period_end: null,
      cancel_at_period_end: false,
      portal_url: null,
    }

    // Fetch user plan information
    const { data: userPlan, error } = await supabaseWithAdminAccess
      .from("users_to_plans")
      .select(
        `
        status,
        plans (
          id,
          name,
          type,
          period
        ),
        meta
      `,
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .single()

    if (error || !userPlan) {
      console.error("Error fetching user plan:", error)
      // If plan not found, return free plan
      return NextResponse.json(defaultPlanInfo)
    }

    // Format response
    const typedUserPlan = userPlan as unknown as UserPlanData

    // Usage statistics
    const usageCount = typedUserPlan.meta?.usage_count || 0

    // Stripe portal URL
    let portalUrl = null
    if (typedUserPlan.meta?.stripe_customer_id) {
      portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/portal`
    }

    // Format the response using database data
    const planInfo = {
      ...defaultPlanInfo,
      name: typedUserPlan.plans?.name || defaultPlanInfo.name,
      type: (typedUserPlan.plans?.type || defaultPlanInfo.type) as
        | "free"
        | "pro"
        | "pro_plus",
      period: typedUserPlan.plans?.period || defaultPlanInfo.period,
      periodEnd: typedUserPlan.meta?.period_end || defaultPlanInfo.periodEnd,
      current_period_end: typedUserPlan.meta?.current_period_end || null,
      cancel_at_period_end: typedUserPlan.meta?.cancel_at_period_end || false,
      usage_count: usageCount,
      portal_url: portalUrl,
    }

    return NextResponse.json(planInfo)
  } catch (error) {
    console.error("Error fetching subscription info:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
