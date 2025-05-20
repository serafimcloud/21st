import { stripeV2 } from "@/lib/stripe"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const checkoutSchema = z.object({
  bundleId: z.number(),
  planId: z.number(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

export async function POST(request: NextRequest) {
  try {
    const authSession = await auth()
    const userId = authSession?.userId
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    const { bundleId, planId, successUrl, cancelUrl } = validationResult.data

    const { data: bundle, error: bundleError } = await supabaseWithAdminAccess
      .from("bundles")
      .select("*")
      .eq("id", bundleId)
      .single()

    if (bundleError) {
      return NextResponse.json(
        { error: "Failed to get bundle or plan" },
        { status: 500 },
      )
    }

    if (bundle.user_id === userId) {
      return NextResponse.json(
        { error: "Cannot purchase your own bundle" },
        { status: 400 },
      )
    }

    const { data: plan, error: planError } = await supabaseWithAdminAccess
      .from("bundle_plans")
      .select("*")
      .eq("id", planId)
      .single()

    if (planError) {
      return NextResponse.json(
        { error: "Failed to get bundle or plan" },
        { status: 500 },
      )
    }

    const { data: userData, error: userError } = await supabaseWithAdminAccess
      .from("users")
      .select("bundles_fee, email")
      .eq("id", userId)
      .single()

    if (userError) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 })
    }

    if (plan.bundle_id !== bundle.id) {
      return NextResponse.json(
        { error: "Plan does not belong to bundle" },
        { status: 400 },
      )
    }

    const transfer_group = `bundle-purchase-${userId}-${bundle.id}-${plan.id}`

    // TODO: Nice to have, but without payments tracking blocks from re-purchasing in case of failed payment
    // idempotencyKey: transfer_group,

    const session = await stripeV2.checkout.sessions.create({
      customer_email: userData.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Bundle "${bundle.name}" (${plan.type} plan)`,
            },
            unit_amount: plan.price, // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        transfer_group,
        metadata: {
          userId,
          bundleId,
          planId,
          fee: userData.bundles_fee,
        },
      },
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    )
  }
}
