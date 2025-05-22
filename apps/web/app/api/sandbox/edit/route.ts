import { checkIsAdmin, supabaseWithAdminAccess } from "@/lib/supabase"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import ShortUUID from "short-uuid"

export async function PUT(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { shortSandboxId, ...updateData } = await request.json()

    if (!shortSandboxId) {
      return NextResponse.json(
        { error: "Sandbox ID is required" },
        { status: 400 },
      )
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No update data provided" },
        { status: 400 },
      )
    }

    const sandboxId = ShortUUID().toUUID(shortSandboxId)
    const isAdmin = await checkIsAdmin(userId)

    let selectSandboxQuery = supabaseWithAdminAccess
      .from("sandboxes")
      .select("id")
      .eq("id", sandboxId)

    if (!isAdmin) {
      selectSandboxQuery = selectSandboxQuery.eq("user_id", userId)
    }

    const { data: sandbox, error } = await selectSandboxQuery

    if (error || !sandbox || sandbox.length === 0) {
      return NextResponse.json(
        { error: "Sandbox not found or access denied" },
        { status: 404 },
      )
    }

    const { error: updateError } = await supabaseWithAdminAccess
      .from("sandboxes")
      .update(updateData)
      .eq("id", sandboxId)

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update sandbox" },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating sandbox:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
