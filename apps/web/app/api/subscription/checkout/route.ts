import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import stripe, { getIdBySubscriptionPlanDetails } from "@/lib/stripe"
import { z } from "zod"
import { supabaseWithAdminAccess } from "@/lib/supabase"

const checkoutSchema = z.object({
  type: z.enum(["standard", "pro"]),
  period: z.enum(["monthly", "yearly"]),
})

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await request.json()

    const validationResult = checkoutSchema.safeParse(body)
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error)
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.errors,
        },
        { status: 400 },
      )
    }

    const { type, period } = validationResult.data

    // Check authentication
    const authSession = await auth()
    let userId = authSession?.userId
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get user email
    const { data: user } = await supabaseWithAdminAccess
      .from("users")
      .select("email")
      .eq("id", userId)
      .single()

    // Get Stripe price ID
    let priceId: string
    try {
      priceId = await getIdBySubscriptionPlanDetails(type, period)
      console.log("Retrieved price ID:", priceId)
    } catch (error) {
      console.error("Error getting price ID:", error)
      return NextResponse.json(
        { error: "Invalid subscription plan configuration" },
        { status: 400 },
      )
    }

    // Create Stripe checkout session
    try {
      const session = await stripe.checkout.sessions.create({
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
        },
        ...(user?.email && { customer_email: user.email }),
        allow_promotion_codes: true,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
        subscription_data: {
          metadata: {
            userId,
          },
        },
      })

      console.log("Created checkout session:", session.id)
      return NextResponse.json({ url: session.url })
    } catch (error) {
      console.error("Stripe session creation error:", error)
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
