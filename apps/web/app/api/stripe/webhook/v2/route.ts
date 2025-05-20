import stripe, { getPlanByStripeId, stripeV2 } from "@/lib/stripe"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { BundlePaymentStatus } from "@/types/global"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET_V2

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

    if (subscription.cancel_at_period_end) {
      const { data: existingUserPlan } = await supabaseWithAdminAccess
        .from("users_to_plans")
        .select("meta")
        .eq("user_id", userId)
        .single()

      if (existingUserPlan) {
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

    const planDetails = await getSubscriptionPlanDetailsById(stripePlanId)

    const { planId, addUsage } = planDetails
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

    let usageLimit = addUsage

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

    const { data: existingUserPlan } = await supabaseWithAdminAccess
      .from("users_to_plans")
      .select()
      .eq("user_id", userId)
      .single()

    if (existingUserPlan) {
      const { data: currentUsageData } = await supabaseWithAdminAccess
        .from("usages")
        .select("limit, usage")
        .eq("user_id", userId)
        .single()

      const currentUsage = currentUsageData?.usage || 0

      const { data: currentPlanData } = await supabaseWithAdminAccess
        .from("users_to_plans")
        .select(
          `
          plans:plan_id (
            id,
            stripe_plan_id,
            price,
            type
          )
        `,
        )
        .eq("user_id", userId)
        .single()

      const { data: newPlanData } = await supabaseWithAdminAccess
        .from("plans")
        .select("price, type")
        .eq("id", planId)
        .single()

      const currentPlanPrice = currentPlanData?.plans
        ? (currentPlanData.plans as any).price || 0
        : 0
      const newPlanPrice = newPlanData ? (newPlanData as any).price || 0 : 0

      const isDowngrade = newPlanPrice < currentPlanPrice

      if (!isDowngrade) {
        await supabaseWithAdminAccess
          .from("usages")
          .upsert(
            {
              user_id: userId,
              limit: usageLimit,
              usage: currentUsage,
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
        const updatedMetaWithFutureLimit = {
          ...meta,
          future_limit: usageLimit,
          is_downgrade: true,
        }

        await supabaseWithAdminAccess
          .from("users_to_plans")
          .update({
            status: "active",
            plan_id: planId,
            updated_at: new Date().toISOString(),
            meta: updatedMetaWithFutureLimit,
            last_paid_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
      }
    } else {
      await supabaseWithAdminAccess
        .from("usages")
        .upsert(
          {
            user_id: userId,
            limit: usageLimit,
            usage: 0,
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

    const planResult = await supabaseWithAdminAccess
      .from("users_to_plans")
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    if (planResult.error) {
      throw new Error(`Failed to update database: ${planResult.error}`)
    }
  } catch (error) {
    throw error
  }
}

async function handleFraudWarning(event: Stripe.Event) {
  const earlyFraudWarning = event.data.object as Stripe.Radar.EarlyFraudWarning
  const paymentIntentId = earlyFraudWarning.payment_intent

  if (!paymentIntentId) {
    throw new Error("No payment intent found in the event")
  }

  const refund = await stripeV2.refunds.create({
    payment_intent: paymentIntentId as string,
  })
  console.log(`Refund created: ${refund.id}`)

  const paymentIntent = await stripeV2.paymentIntents.retrieve(
    paymentIntentId as string,
  )

  if (paymentIntent.customer) {
    const deletedCustomer = await stripeV2.customers.del(
      paymentIntent.customer as string,
    )
    console.log(
      `Customer ${paymentIntent.customer} deleted: ${deletedCustomer.deleted}`,
    )
  }
}

async function handleCheckoutSession(
  event:
    | Stripe.PaymentIntentCanceledEvent
    | Stripe.PaymentIntentPaymentFailedEvent
    | Stripe.PaymentIntentProcessingEvent
    | Stripe.PaymentIntentSucceededEvent,
) {
  let status: BundlePaymentStatus | null = null
  switch (event.type) {
    case "payment_intent.canceled":
    case "payment_intent.payment_failed":
      status = "rejected"
      break
    case "payment_intent.succeeded":
      status = "paid"
      break
    case "payment_intent.processing":
      status = "pending"
      break
  }

  if (!status) {
    throw new Error("No status got from event")
  }

  const paymentIntent = event.data.object
  if (!paymentIntent.metadata) {
    throw new Error("No metadata found in event")
  }

  const { userId, bundleId, planId, fee } = paymentIntent.metadata
  const price = paymentIntent.amount

  if (!userId || !bundleId || !planId || !price || !fee) {
    throw new Error(
      `Not enough data found in metadata: ${JSON.stringify(paymentIntent.metadata)}`,
    )
  }

  const { data: existingBundlePurchase, error: existingBundlePurchaseError } =
    await supabaseWithAdminAccess
      .from("bundle_purchases")
      .select("*")
      .eq("id", paymentIntent.id)
      .maybeSingle()

  if (existingBundlePurchaseError) {
    throw new Error(
      `Failed to get bundle purchase: ${existingBundlePurchaseError}`,
    )
  }

  const { data: lastBundlePurchase, error: lastBundlePurchaseError } =
    await supabaseWithAdminAccess
      .from("bundle_purchases")
      .select("*")
      .eq("user_id", userId)
      .eq("bundle_id", Number(bundleId))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

  if (lastBundlePurchaseError) {
    throw new Error(
      `Failed to get last bundle purchase: ${lastBundlePurchaseError}`,
    )
  }

  // Refund paid -> paid
  if (
    (lastBundlePurchase?.status === "paid" ||
      lastBundlePurchase?.status === "pending") &&
    status === "paid"
  ) {
    stripe.refunds.create({
      payment_intent: paymentIntent.id,
      reason: "duplicate",
    })
    return
  }

  // Prevent non-pending -> pending
  if (
    existingBundlePurchase?.status &&
    existingBundlePurchase.status !== "pending" &&
    status === "pending"
  ) {
    return
  }

  // Upsert only pending/undefined -> non-pending
  if (
    existingBundlePurchase?.status === undefined ||
    existingBundlePurchase.status === "pending"
  ) {
    const { error: upsertError } = await supabaseWithAdminAccess
      .from("bundle_purchases")
      .upsert({
        id: paymentIntent.id,
        user_id: existingBundlePurchase?.user_id || userId,
        bundle_id: existingBundlePurchase?.bundle_id || Number(bundleId),
        plan_id: existingBundlePurchase?.plan_id || Number(planId),
        price: existingBundlePurchase?.price || price,
        status: status,
        fee: existingBundlePurchase?.fee || Number(fee),
        paid_to_user: existingBundlePurchase?.paid_to_user || false,
      })

    if (upsertError) {
      throw new Error(`Failed to upsert bundle purchase: ${upsertError}`)
    }
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
    event = stripeV2.webhooks.constructEvent(body, sig, stripeWebhookSecret!)
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 },
    )
  }

  console.log("body", body)
  console.log("-----")
  console.log("event", event)

  const eventObject = event.data.object
  let userId

  if ("metadata" in eventObject && eventObject.metadata?.userId) {
    userId = eventObject.metadata.userId
  } else {
    return NextResponse.json(
      { error: "No userId found in event object metadata" },
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
      case "radar.early_fraud_warning.created":
        await handleFraudWarning(event)
        break
      case "payment_intent.canceled":
      case "payment_intent.payment_failed":
      case "payment_intent.processing":
      case "payment_intent.succeeded":
        await handleCheckoutSession(event)
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
