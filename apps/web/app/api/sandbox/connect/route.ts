import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { checkIsAdmin, supabaseWithAdminAccess } from "@/lib/supabase"
import {
  codesandboxSdk,
  DEFAULT_HIBERNATION_TIMEOUT,
} from "@/lib/codesandbox-sdk"
import ShortUUID from "short-uuid"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = await checkIsAdmin(userId)

    const { shortSandboxId } = await request.json()

    const sandboxId = ShortUUID().toUUID(shortSandboxId)

    if (!sandboxId) {
      return NextResponse.json(
        { error: "Sandbox ID is required" },
        { status: 400 },
      )
    }

    let query = supabaseWithAdminAccess
      .from("sandboxes")
      .select("codesandbox_id, name, id, component_id")
      .eq("id", sandboxId)

    if (!isAdmin) {
      // non-admins can see only their own sandbox
      query = query.eq("user_id", userId)
    }

    const { data: sandbox, error } = await query.single()

    if (error || !sandbox) {
      return NextResponse.json(
        { error: "Sandbox not found or access denied" },
        { status: 404 },
      )
    }

    if (!sandbox.codesandbox_id) {
      return NextResponse.json(
        { error: "Sandbox codesandbox_id is missing" },
        { status: 400 },
      )
    }
    const startData = await codesandboxSdk.sandbox.start(
      sandbox.codesandbox_id,
      {
        hibernationTimeoutSeconds: DEFAULT_HIBERNATION_TIMEOUT,
      },
    )

    return NextResponse.json({ success: true, startData, sandbox })
  } catch (error) {
    console.error("Error connecting to sandbox:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
