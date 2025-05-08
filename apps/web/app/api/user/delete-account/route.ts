import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"

export async function DELETE() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete user from Supabase database
    const { error } = await supabaseWithAdminAccess
      .from("users")
      .delete()
      .eq("id", userId)

    if (error) {
      console.error("Error deleting user account from Supabase:", error)
      return NextResponse.json(
        { error: "Failed to delete account from database" },
        { status: 500 },
      )
    }

    // Note: This only deletes the user from the Supabase database
    // The Clerk account deletion will be handled by the webhook when the user deletes their account
    // through the Clerk User Portal

    return NextResponse.json({
      success: true,
      message:
        "Account data deleted. Please visit your account settings to delete your authentication account.",
      clerkAccountUrl:
        process.env.NODE_ENV === "development"
          ? "https://wanted-titmouse-48.accounts.dev/user"
          : "https://accounts.21st.dev/user",
    })
  } catch (error) {
    console.error("Error in delete account API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
