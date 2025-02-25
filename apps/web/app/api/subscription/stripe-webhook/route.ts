import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import stripe, { getPlanByStripeId } from "@/lib/stripe"

const stripeWebhookSecret =
  process.env.NODE_ENV === "development"
    ? process.env.STRIPE_WEBHOOK_SECRET_TEST // process.env.STRIPE_WEBHOOK_SECRET_LOCAL
    : process.env.STRIPE_WEBHOOK_SECRET_LIVE

async function getSubscriptionPlanDetailsById(planId: string) {
  const plan = await getPlanByStripeId(planId)

  return {
    planId: plan.id, // Actual plan ID in our database
    planType: plan.type,
    planPeriod: plan.period,
  }
}

async function handleSubscriptionCreatedOrUpdate(event: Stripe.Event) {
  try {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata.userId as string
    const subscriptionId = subscription.id
    const stripePlanId = subscription.items.data[0]?.plan?.id

    if (!stripePlanId) {
      throw new Error("No plan ID found in subscription")
    }

    const { planId, planType, planPeriod } =
      await getSubscriptionPlanDetailsById(stripePlanId)
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

    // Set usage limit based on plan type
    let usageLimit = 10 // Default free limit
    if (planType === "standard") {
      usageLimit = 600
    } else if (planType === "pro") {
      usageLimit = 9999
    }

    // Create metadata for the users_to_plans table
    const meta = {
      stripe_subscription_id: subscriptionId,
      stripe_plan_id: stripePlanId,
      period_end: currentPeriodEnd.toISOString(),
    }

    // Check if user already has a plan
    const { data: existingUserPlan } = await (
      supabaseWithAdminAccess.from("users_to_plans") as any
    )
      .select()
      .eq("user_id", userId)
      .single()

    // Transaction for Supabase operations
    if (existingUserPlan) {
      // Update existing user plan
      await (supabaseWithAdminAccess.from("usage") as any).upsert(
        {
          user_id: userId,
          limit: usageLimit,
          // Preserve existing usage count if present
          usage: existingUserPlan ? undefined : 0,
        },
        { onConflict: "user_id" },
      )

      await (supabaseWithAdminAccess.from("users_to_plans") as any)
        .update({
          status: "active",
          plan_id: planId,
          updated_at: new Date().toISOString(),
          meta,
          last_paid_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
    } else {
      // Create new user plan
      await (supabaseWithAdminAccess.from("usage") as any).upsert(
        {
          user_id: userId,
          limit: usageLimit,
          usage: 0, // Start with 0 usage for new subscriptions
        },
        { onConflict: "user_id" },
      )

      await (supabaseWithAdminAccess.from("users_to_plans") as any).insert({
        user_id: userId,
        plan_id: planId,
        status: "active",
        meta,
        last_paid_at: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("Failed to process subscription creation or update:", error)
    throw error
  }
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  try {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata.userId as string

    await (supabaseWithAdminAccess.from("users_to_plans") as any)
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
  } catch (error) {
    console.error("Error handling subscription deletion:", error)
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json(
      { error: "No Stripe signature found" },
      { status: 400 },
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, stripeWebhookSecret!)
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 },
    )
  }

  // Check if we have a userId in the metadata
  // @ts-ignore
  if (!event.data.object?.metadata?.userId) {
    return NextResponse.json(
      { error: "No userId found in subscription metadata" },
      { status: 400 },
    )
  }

  console.log("Event", event.data.object)

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionCreatedOrUpdate(event)
        break
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event)
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json(
      { error: "Error processing webhook" },
      { status: 500 },
    )
  }
}
