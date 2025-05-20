import stripe, { getStripeId } from "@/lib/stripe"
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stripeId = await getStripeId(userId)

    const accountLink = await stripe.accounts.createLoginLink(stripeId)

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get stripe account" },
      { status: 500 },
    )
  }
}
