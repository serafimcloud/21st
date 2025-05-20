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
    const account = await stripe.accounts.retrieve(stripeId)

    return NextResponse.json(account)
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to get stripe account` },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stripeId = await getStripeId(userId)

    return NextResponse.json({ stripeId })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to get stripe account` },
      { status: 500 },
    )
  }
}
