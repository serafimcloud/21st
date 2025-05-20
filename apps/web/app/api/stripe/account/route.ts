import stripe from "@/lib/stripe"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

export const getStripeId = async (userId: string): Promise<string> => {
  const { data: userData, error: userError } = await supabaseWithAdminAccess
    .from("users")
    .select("stripe_id, display_username, username, email")
    .eq("id", userId)
    .maybeSingle()

  if (userError) {
    throw new Error(userError.message)
  }

  let stripeId = userData?.stripe_id
  if (!stripeId) {
    const account = await stripe.accounts.create({
      business_profile: {
        url: `https://21st.dev/${userData?.display_username ?? userData?.username}`,
        product_description:
          "Sell UI components (source code) for web developers",
      },
      controller: {
        stripe_dashboard: {
          type: "express",
        },
        fees: {
          payer: "application",
        },
        losses: {
          payments: "application",
        },
      },
      // tos_acceptance: {
      //   service_agreement: "recipient",
      // },
    })

    const { error: updateError } = await supabaseWithAdminAccess
      .from("users")
      .update({
        stripe_id: account.id,
      })
      .eq("id", userId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    stripeId = account.id
  }

  return stripeId
}

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
