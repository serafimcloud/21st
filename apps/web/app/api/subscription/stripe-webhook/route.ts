import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import stripe, { getPlanByStripeId } from "@/lib/stripe"
import { getGenerationLimit } from "@/lib/config/subscription-plans"

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET

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

    // Check cancel_at_period_end for scheduled cancellations
    if (subscription.cancel_at_period_end) {
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

      // Get existing user plan
      const { data: existingUserPlan } = await supabaseWithAdminAccess
        .from("users_to_plans")
        .select("meta")
        .eq("user_id", userId)
        .single()

      if (existingUserPlan) {
        // Update metadata with cancellation information
        const updatedMeta = {
          ...(existingUserPlan.meta
            ? JSON.parse(JSON.stringify(existingUserPlan.meta))
            : {}),
          will_cancel_at_end: true,
          cancel_at: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : null,
        }

        await supabaseWithAdminAccess
          .from("users_to_plans")
          .update({
            meta: updatedMeta,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
      }
    }

    // Try to get plan details
    const planDetails = await getSubscriptionPlanDetailsById(stripePlanId)

    const { planId, addUsage } = planDetails
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

    let usageLimit = addUsage

    // Create metadata for the users_to_plans table
    const meta = {
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscriptionId,
      stripe_plan_id: stripePlanId,
      period_end: currentPeriodEnd.toISOString(),
      will_cancel_at_end: subscription.cancel_at_period_end || false,
      cancel_at: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000).toISOString()
        : null,
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
    throw error
  }
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  try {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata.userId as string
    const subscriptionId = subscription.id

    // Get free plan limit
    const freeUsageLimit = getGenerationLimit("free")

    // Update usages table - set free usage limit
    const usageResult = await supabaseWithAdminAccess
      .from("usages")
      .update({
        limit: freeUsageLimit,
      })
      .eq("user_id", userId)

    // Update plan status to inactive
    const planResult = await supabaseWithAdminAccess
      .from("users_to_plans")
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    if (planResult.error || usageResult.error) {
      throw new Error(
        `Failed to update database: ${planResult.error || usageResult.error}`,
      )
    }
  } catch (error) {
    throw error
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
    return NextResponse.json(
      { error: "Error processing webhook" },
      { status: 500 },
    )
  }
}
