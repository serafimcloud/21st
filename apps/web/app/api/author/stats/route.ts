import { supabaseWithAdminAccess } from "@/lib/supabase"
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: payoutStats, error: payoutError } = await (
      supabaseWithAdminAccess.rpc as any
    )("get_daily_user_earnings", {
      p_user_id: userId,
    })

    if (payoutError) {
      console.error("Error fetching author payout stats:", payoutError)
      return NextResponse.json(
        { error: "Failed to fetch author statistics" },
        { status: 500 },
      )
    }

    const { data: payouts, error: payoutsError } = await supabaseWithAdminAccess
      .from("mcp_author_payouts")
      .select(
        "id, period_start, period_end, total_amount, paypal_email, status, transaction_id, created_at, processed_at",
      )
      .eq("author_id", userId)

    if (payoutsError) {
      console.error("Error fetching author payouts:", payoutsError)
      return NextResponse.json(
        { error: "Failed to fetch author payouts" },
        { status: 500 },
      )
    }

    const { count: publishedComponentsCount, error: componentsError } =
      await supabaseWithAdminAccess
        .from("components")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_public", true)

    if (componentsError) {
      console.error("Error counting published components:", componentsError)
      return NextResponse.json(
        { error: "Failed to count published components" },
        { status: 500 },
      )
    }

    const responseData = {
      published_components: publishedComponentsCount || 0,
      payoutStats,
      payouts,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Author stats error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
