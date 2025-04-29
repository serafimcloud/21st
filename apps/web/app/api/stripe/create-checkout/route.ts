import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import stripe, { stripeV2, getIdBySubscriptionPlanDetails } from "@/lib/stripe"
import { z } from "zod"
import { supabaseWithAdminAccess } from "@/lib/supabase"

const checkoutSchema = z.object({
  planId: z.enum(["pro", "pro_plus"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  period: z.enum(["monthly", "yearly"]).optional().default("monthly"),
  isUpgrade: z.boolean().optional(),
  currentPlanId: z.enum(["free", "pro", "pro_plus"]).optional(),
  subscriptionId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validationResult = checkoutSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.errors,
        },
        { status: 400 },
      )
    }

    const {
      planId,
      successUrl,
      cancelUrl,
      period,
      isUpgrade,
      currentPlanId,
      subscriptionId,
    } = validationResult.data

    const authSession = await auth()
    const userId = authSession?.userId
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: user, error: userError } = await supabaseWithAdminAccess
      .from("users")
      .select("email")
      .eq("id", userId)
      .maybeSingle()

    let priceId: string
    try {
      // Always use version 2 for new checkouts
      priceId = await getIdBySubscriptionPlanDetails(planId, period, 2)
      // priceId = "price_1RBCVXGClBhopEwDdb3OTKtZ"
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid subscription plan configuration" },
        { status: 400 },
      )
    }

    try {
      if (isUpgrade && currentPlanId !== "free" && subscriptionId) {
        try {
          // For existing subscriptions, use the fallback proxy which will try V2 then V1
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId)

          if (subscription.metadata.userId === userId) {
            const subscriptionItemId = subscription.items.data[0]?.id

            if (!subscriptionItemId) {
              throw new Error("Subscription item not found")
            }

            if (!planId) {
              throw new Error("Plan ID is undefined")
            }

            const updatedMetadata: Record<string, string> = {}

            for (const [key, value] of Object.entries(
              subscription.metadata || {},
            )) {
              if (value) updatedMetadata[key] = value
            }

            updatedMetadata.upgraded_from = currentPlanId || "free"
            updatedMetadata.upgraded_to = planId
            updatedMetadata.upgraded_at = new Date().toISOString()

            // For updates, use the fallback proxy which will try V2 then V1
            const updatedSubscription = await stripe.subscriptions.update(
              subscription.id,
              {
                items: [
                  {
                    id: subscriptionItemId,
                    price: priceId,
                  },
                ],
                proration_behavior: "create_prorations",
                metadata: updatedMetadata,
              },
            )

            return NextResponse.json({
              url: successUrl,
              directly_upgraded: true,
            })
          }
        } catch (subscriptionError) {
          // Subscription error handled silently, will fall back to creating new checkout
        }
      }

      // For new checkout sessions, always use V2
      const session = await stripeV2.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        metadata: {
          userId,
          ...(isUpgrade && { isUpgrade: "true", oldPlanId: currentPlanId }),
        },
        ...(user?.email && { customer_email: user.email }),
        allow_promotion_codes: true,
        tax_id_collection: {
          enabled: true,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        subscription_data: {
          metadata: {
            userId,
            ...(isUpgrade && { upgraded_from: currentPlanId }),
          },
        },
      })

      return NextResponse.json({ url: session.url })
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 },
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
