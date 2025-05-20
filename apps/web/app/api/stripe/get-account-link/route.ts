import stripe, { getStripeId } from "@/lib/stripe"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabaseWithAdminAccess
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    if (userError) {
      return NextResponse.json(
        { error: "Failed to get user data" },
        { status: 500 },
      )
    }

    const stripeId = await getStripeId(userId)
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/studio/${userData.display_username}/monetization`

    const accountLink = await stripe.accountLinks.create({
      account: stripeId,
      refresh_url: returnUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get stripe account" },
      { status: 500 },
    )
  }
}
