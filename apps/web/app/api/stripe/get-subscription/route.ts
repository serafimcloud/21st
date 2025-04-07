import { NextResponse } from "next/server"
import { stripeV1, stripeV2 } from "@/lib/stripe"
import { auth } from "@clerk/nextjs/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { PLAN_LIMITS, PlanType } from "@/lib/config/subscription-plans"

interface SubscriptionMeta {
  stripe_subscription_id?: string
  stripe_customer_id?: string
  current_period_end?: string
  cancel_at_period_end?: boolean
  portal_url?: string
  period_end?: string
}

export async function GET() {
  try {
    const { userId } = await auth()

    const defaultPlanInfo = {
      name: PLAN_LIMITS.free.displayName,
      type: "free" as PlanType,
      usage: 0,
      limit: PLAN_LIMITS.free.generationsPerMonth,
      current_period_end: undefined,
      cancel_at_period_end: false,
      portal_url: undefined,
    }

    if (!userId) {
      return NextResponse.json(defaultPlanInfo, { status: 200 })
    }

    console.log("Fetching subscription for user:", userId)

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
          add_usage,
          version
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
      return NextResponse.json(defaultPlanInfo, { status: 200 })
    }

    if (!userPlan) {
      return NextResponse.json(
        {
          ...defaultPlanInfo,
          usage: usageData?.usage || 0,
          limit: usageData?.limit || PLAN_LIMITS.free.generationsPerMonth,
        },
        { status: 200 },
      )
    }

    const plansData = userPlan.plans as any
    const planType = (plansData?.type || "free") as PlanType
    const planVersion = plansData?.version || 2
    // Select the appropriate Stripe instance based on plan version
    const stripeInstance = planVersion === 1 ? stripeV1 : stripeV2

    const meta = (userPlan.meta as SubscriptionMeta) || {}

    const planLimit =
      usageData?.limit ||
      PLAN_LIMITS[planType].generationsPerMonth + (plansData?.add_usage || 0) ||
      PLAN_LIMITS[planType].generationsPerMonth

    let stripeSubscription = null
    let portal_url = meta?.portal_url || null

    if (meta?.stripe_subscription_id) {
      try {
        stripeSubscription = await stripeInstance.subscriptions.retrieve(
          meta.stripe_subscription_id,
        )
      } catch (error) {
        console.error("Error fetching Stripe subscription:", error)
      }
    }

    if (meta?.stripe_customer_id && !portal_url) {
      try {
        const { url } = await stripeInstance.billingPortal.sessions.create({
          customer: meta.stripe_customer_id,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
        })
        portal_url = url
      } catch (error) {
        console.error("Error creating portal session:", error)
      }
    }

    const planInfo = {
      id: userPlan.id.toString(),
      name:
        PLAN_LIMITS[planType]?.displayName ||
        plansData?.stripe_plan_id ||
        defaultPlanInfo.name,
      type: planType,
      period: plansData?.period || null,
      periodEnd: meta?.period_end || null,
      current_period_end: stripeSubscription?.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
        : meta?.current_period_end || null,
      cancel_at_period_end:
        stripeSubscription?.cancel_at_period_end ||
        meta?.cancel_at_period_end ||
        false,
      usage: usageData?.usage || 0,
      limit: planLimit,
      portal_url,
      stripe_subscription_id: meta?.stripe_subscription_id,
      planData: plansData
        ? {
            id: plansData.id,
            stripe_plan_id: plansData.stripe_plan_id,
            price: plansData.price,
            env: plansData.env,
            period: plansData.period,
            type: plansData.type,
            add_usage: plansData.add_usage,
            version: plansData.version,
          }
        : undefined,
    }

    return NextResponse.json(planInfo, { status: 200 })
  } catch (error) {
    console.error("Error in get-subscription route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
