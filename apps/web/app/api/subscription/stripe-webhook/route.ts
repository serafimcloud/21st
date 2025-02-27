import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import stripe, { getPlanByStripeId } from "@/lib/stripe"
import { getGenerationLimit } from "@/lib/subscription-limits"

const stripeWebhookSecret =
  process.env.NODE_ENV === "development"
    ? process.env.STRIPE_WEBHOOK_SECRET_TEST
    : process.env.STRIPE_WEBHOOK_SECRET_LIVE

async function getSubscriptionPlanDetailsById(planId: string) {
  const plan = await getPlanByStripeId(planId)

  return {
    planId: plan.id,
    planType: plan.type,
    planPeriod: plan.period,
    addUsage: plan.add_usage,
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

    const { planId, planType, addUsage } =
      await getSubscriptionPlanDetailsById(stripePlanId)
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

    // Set usage limit based on the plan type
    let usageLimit = getGenerationLimit("free") // Default free limit
    if (planType) {
      usageLimit = getGenerationLimit(planType as any)
    } else if (addUsage) {
      // Fallback to the old method if planType is not available
      usageLimit = addUsage
    }

    // Create metadata for the users_to_plans table
    const meta = {
      stripe_subscription_id: subscriptionId,
      stripe_plan_id: stripePlanId,
      period_end: currentPeriodEnd.toISOString(),
    }

    // Check if user already has a plan
    const { data: existingUserPlan } = await supabaseWithAdminAccess
      .from("users_to_plans")
      .select()
      .eq("user_id", userId)
      .single()

    // Transaction for Supabase operations
    if (existingUserPlan) {
      // Update existing user plan

      await supabaseWithAdminAccess
        .from("usages")
        .upsert(
          {
            user_id: userId,
            limit: usageLimit,
            usage: 0, // Reset usage to 0 when subscription is updated
          },
          { onConflict: "user_id" },
        )
        .select()

      await supabaseWithAdminAccess
        .from("users_to_plans")
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
      await supabaseWithAdminAccess
        .from("usages")
        .upsert(
          {
            user_id: userId,
            limit: usageLimit,
            usage: 0, // Start with 0 usage for new subscriptions
          },
          { onConflict: "user_id" },
        )
        .select()

      await supabaseWithAdminAccess.from("users_to_plans").insert({
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

    await supabaseWithAdminAccess
      .from("users_to_plans")
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
