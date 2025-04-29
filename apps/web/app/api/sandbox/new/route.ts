import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import ShortUUID from "short-uuid"
import {
  DEFAULT_HIBERNATION_TIMEOUT,
  DEFAULT_TEMPLATE,
  TEMPLATES,
  codesandboxSdk,
} from "@/lib/codesandbox-sdk"

export async function POST() {
  try {
    const { userId } = await auth()

    console.log("userId", userId)

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Creating CodeSandbox instance...")
    const sandbox = await codesandboxSdk.sandbox.create({
      template: TEMPLATES[DEFAULT_TEMPLATE],
      hibernationTimeoutSeconds: DEFAULT_HIBERNATION_TIMEOUT,
      privacy: "public", // Public visibility
    })

    const codesandboxId = sandbox.id
    console.log(`CodeSandbox instance created: ${codesandboxId}`)

    const now = new Date().toISOString()
    const { data: dbSandbox, error: dbError } = await supabaseWithAdminAccess
      .from("sandboxes")
      .insert({
        user_id: userId,
        codesandbox_id: codesandboxId,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Error storing sandbox:", dbError)
      return new NextResponse("Failed to save sandbox data", { status: 500 })
    }

    console.log(`Sandbox created and stored with ID: ${dbSandbox.id}`)

    const shortId = ShortUUID().fromUUID(dbSandbox.id)

    return NextResponse.json({
      success: true,
      shortSandboxId: shortId,
    })
  } catch (error) {
    console.error("Error creating sandbox:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
