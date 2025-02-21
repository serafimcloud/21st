import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import prisma from "~/datasources/prisma"
import stripe, { getSubscriptionPlanDetailsById } from "~/datasources/stripe"

const isTestMode = false

const stripeWebhookSecret =
  process.env.NODE_ENV === "development"
    ? process.env.STRIPE_WEBHOOK_SECRET_LOCAL
    : isTestMode
      ? process.env.STRIPE_WEBHOOK_SECRET_TEST
      : process.env.STRIPE_WEBHOOK_SECRET_PROD

async function handleSubscriptionCreatedOrUpdate(event: Stripe.Event) {
  try {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata.userId
    const subscriptionId = subscription.id
    const planId = subscription.items.data[0]?.plan?.id
    if (!planId) {
      throw new Error("No plan ID found in subscription")
    }

    const { planType, planPeriod } = getSubscriptionPlanDetailsById(planId)
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

    let usageLimit = 10 // Default free limit
    if (planType === "growth") {
      usageLimit = 600
    } else if (planType === "scale") {
      usageLimit = 9999
    }

    let userSubscription = await prisma.subscription.findUnique({
      where: { userId: userId },
    })

    await prisma.$transaction([
      prisma.usageLimit.upsert({
        where: { userId: userId },
        update: { limit: usageLimit },
        create: {
          userId: userId,
          limit: usageLimit,
        },
      }),
      userSubscription
        ? prisma.subscription.update({
            where: { userId: userId },
            data: {
              isActive: true,
              planId,
              planType,
              planPeriod,
              stripeSubscriptionId: subscriptionId,
              currentPeriodEnd: currentPeriodEnd,
            },
          })
        : prisma.subscription.create({
            data: {
              userId: userId,
              planId,
              planType,
              planPeriod,
              stripeSubscriptionId: subscriptionId,
              currentPeriodEnd: currentPeriodEnd,
              isActive: true,
            },
          }),
    ])
  } catch (error) {
    console.error("Failed to process subscription creation or update:", error)
    throw error
  }
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  try {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata.userId

    await prisma.subscription.update({
      where: { userId: userId },
      data: { isActive: false },
    })
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
