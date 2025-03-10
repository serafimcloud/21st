import { NextRequest, NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams

    // Get filter parameters
    const period = searchParams.get("period") || null
    const minAmount = searchParams.get("minAmount")
      ? parseFloat(searchParams.get("minAmount") as string)
      : null
    const maxAmount = searchParams.get("maxAmount")
      ? parseFloat(searchParams.get("maxAmount") as string)
      : null
    const status = searchParams.get("status") || null
    const sortBy = searchParams.get("sortBy") || "total_amount"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")

    // Calculate offset
    const offset = (page - 1) * pageSize

    // Call the Supabase RPC function
    const { data: authorPayouts, error: payoutsError } = await (
      supabaseWithAdminAccess.rpc as any
    )("get_all_author_payouts", {
      p_period: period,
      p_min_amount: minAmount,
      p_max_amount: maxAmount,
      p_status: status,
      p_sort_by: sortBy,
      p_sort_order: sortOrder,
      p_limit: pageSize,
      p_offset: offset,
    })

    if (payoutsError) {
      console.error("Error fetching author payouts:", payoutsError)
      return NextResponse.json(
        { error: "Failed to fetch author payouts" },
        { status: 500 },
      )
    }

    // Get total count for pagination
    const { data: totalCount, error: countError } = await (
      supabaseWithAdminAccess.rpc as any
    )("get_all_author_payouts_count", {
      p_period: period,
      p_min_amount: minAmount,
      p_max_amount: maxAmount,
      p_status: status,
    })

    if (countError) {
      console.error("Error fetching total count:", countError)
      return NextResponse.json(
        { error: "Failed to fetch total count" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      data: authorPayouts,
      pagination: {
        total: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    })
  } catch (error) {
    console.error("Public dashboard error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
