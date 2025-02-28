import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import stripe from "@/lib/stripe"
import { supabaseWithAdminAccess } from "@/lib/supabase"

interface UserPlanMeta {
  stripe_subscription_id?: string
  stripe_customer_id?: string
  stripe_plan_id?: string
  period_end?: string
  will_cancel_at_end?: boolean
  cancel_at?: string | null
}

export async function POST(request: NextRequest) {
  try {
    const authSession = await auth()
    const userId = authSession?.userId

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's current subscription from Supabase
    const { data: userPlan, error: userPlanError } =
      await supabaseWithAdminAccess
        .from("users_to_plans")
        .select("meta")
        .eq("user_id", userId)
        .eq("status", "active")
        .single()

    const subscriptionId =
      userPlan?.meta && (userPlan.meta as UserPlanMeta).stripe_subscription_id

    if (userPlanError || !subscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 },
      )
    }

    try {
      // Cancel the subscription in Stripe
      const subscription = await stripe.subscriptions.cancel(subscriptionId)

      if (subscription.status === "canceled") {
        return NextResponse.json({
          success: true,
          message: "Subscription successfully canceled",
        })
      }

      return NextResponse.json(
        { error: "Failed to cancel subscription" },
        { status: 500 },
      )
    } catch (stripeError: any) {
      console.error("Stripe error:", stripeError)
      return NextResponse.json(
        {
          error: stripeError.message || "Failed to cancel subscription",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in cancel-subscription:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
