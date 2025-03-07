import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { PromptRule } from "@/types/prompt-rules"

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the selected rule ID from the query parameter
    const url = new URL(request.url)
    const ruleId = url.searchParams.get("ruleId")

    if (!ruleId) {
      return NextResponse.json(
        { error: "Rule ID is required" },
        { status: 400 },
      )
    }

    // Get the prompt rule
    const { data, error } = await supabaseWithAdminAccess
      .from("prompt_rules")
      .select("*")
      .eq("id", ruleId)
      .eq("user_id", userId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Rule not found" }, { status: 404 })
      }
      console.error("Error fetching prompt rule:", error)
      return NextResponse.json(
        { error: "Error fetching prompt rule" },
        { status: 500 },
      )
    }

    return NextResponse.json(data as PromptRule)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
