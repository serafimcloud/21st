import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import stripe, { getIdBySubscriptionPlanDetails } from "@/lib/stripe"
import { z } from "zod"
import { mixpanel } from "~/utils/mixpanel"

const checkoutSchema = z.object({
  plan: z.enum(["growth", "scale"]),
  option: z.enum(["annual", "monthly"]),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = checkoutSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 },
      )
    }

    const { plan, option } = validationResult.data
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const priceId = getIdBySubscriptionPlanDetails(plan, option)

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
      allow_promotion_codes: true,
      customer_email: user.email || undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
      subscription_data: {
        metadata: {
          userId,
        },
      },
    })

    mixpanel.track("Checkout Session Created", {
      distinct_id: userId,
      testGroup: user.testGroup,
      plan,
      option,
      priceId,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
