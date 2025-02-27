import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"

interface PlanData {
  name: string
  type: "free" | "standard" | "pro"
  period?: string | null
}

interface UserPlanData {
  status: string
  plans?: PlanData
  meta?: Record<string, any>
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authSession = await auth()
    const userId = authSession?.userId

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user plan information
    const { data: userPlan, error } = await supabaseWithAdminAccess
      .from("users_to_plans")
      .select(
        `
        status,
        plans (
          id,
          name,
          type,
          period
        ),
        meta
      `,
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .single()

    if (error) {
      console.error("Error fetching user plan:", error)

      // If plan not found, return free plan
      return NextResponse.json({
        name: "Free Plan",
        type: "free",
      })
    }

    if (!userPlan) {
      return NextResponse.json({
        name: "Free Plan",
        type: "free",
      })
    }

    // Format response
    const typedUserPlan = userPlan as unknown as UserPlanData
    const planInfo = {
      name: typedUserPlan.plans?.name || "Free Plan",
      type: typedUserPlan.plans?.type || "free",
      period: typedUserPlan.plans?.period || null,
      periodEnd: typedUserPlan.meta?.period_end || null,
    }

    return NextResponse.json(planInfo)
  } catch (error) {
    console.error("Error fetching subscription info:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
