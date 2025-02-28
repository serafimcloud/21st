import { NextResponse } from "next/server"
import Stripe from "stripe"
import { auth } from "@clerk/nextjs/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { PostgrestError } from "@supabase/supabase-js"

interface SubscriptionMeta {
  stripe_subscription_id?: string
  stripe_customer_id?: string
  current_period_end?: string
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        {
          name: "Free Plan",
          type: "free",
          usage_count: 0,
        },
        { status: 200 },
      )
    }

    console.log("Fetching subscription for user:", userId)

    // Get subscription from Supabase
    const { data: subscription, error } = await supabaseWithAdminAccess
      .from("users_to_plans")
      .select(
        `
        id,
        user_id,
        plan_id,
        status,
        meta,
        last_paid_at,
        created_at,
        updated_at
      `,
      )
      .eq("user_id", userId)
      .single()

    console.log("Subscription query result:", { subscription, error })

    // If no subscription found or error is PGRST116 (no rows), return free plan
    if (
      !subscription ||
      (error as PostgrestError | null)?.code === "PGRST116"
    ) {
      return NextResponse.json(
        {
          name: "Free Plan",
          type: "free",
          usage_count: 0,
        },
        { status: 200 },
      )
    }

    // If other error occurred
    if (error) {
      console.error("Error fetching subscription:", error)
      return NextResponse.json(
        { error: "Failed to fetch subscription" },
        { status: 500 },
      )
    }

    // Get plan details
    const { data: plan } = await supabaseWithAdminAccess
      .from("plans")
      .select("*")
      .eq("id", subscription.plan_id)
      .single()

    // Get usage count
    const { data: usage } = await supabaseWithAdminAccess
      .from("usages")
      .select("usage, limit")
      .eq("user_id", userId)
      .single()

    // If subscription has Stripe ID, get additional info from Stripe
    let stripeSubscription = null
    const meta = subscription.meta as SubscriptionMeta

    if (meta?.stripe_subscription_id) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          meta.stripe_subscription_id,
        )
      } catch (error) {
        console.error("Error fetching Stripe subscription:", error)
      }
    }

    // Get portal URL only if customer ID exists
    let portal_url = null
    if (meta?.stripe_customer_id) {
      try {
        const { url } = await stripe.billingPortal.sessions.create({
          customer: meta.stripe_customer_id,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
        })
        portal_url = url
      } catch (error) {
        console.error("Error creating portal session:", error)
      }
    }

    return NextResponse.json({
      id: subscription.id,
      name:
        plan?.type === "free"
          ? "Free Plan"
          : `${plan?.type?.toUpperCase()} Plan`,
      type: plan?.type || "free",
      period: plan?.period || null,
      periodEnd: meta?.current_period_end || null,
      usage_count: usage?.usage || 0,
      current_period_end: stripeSubscription?.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: stripeSubscription?.cancel_at_period_end || false,
      portal_url,
      stripe_subscription_id: meta?.stripe_subscription_id,
    })
  } catch (error) {
    console.error("Error in get-subscription route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
