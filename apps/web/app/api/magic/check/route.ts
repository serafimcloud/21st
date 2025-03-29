import { NextRequest, NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey =
      searchParams.get("apikey") || request.headers.get("x-api-key")

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing API key" },
        { status: 401 },
      )
    }

    try {
      const { data, error } = await supabaseWithAdminAccess
        .from("api_keys")
        .select("user_id")
        .eq("key", apiKey)
        .eq("is_active", true)
        .single()

      if (error || !data) {
        console.error("API key validation failed:", error)
        throw new Error("Invalid or inactive API key")
      }

      return NextResponse.json({
        success: true,
        message: "API key is valid and active",
      })
    } catch (error) {
      // Handle specific API key validation error
      if (
        error instanceof Error &&
        error.message === "Invalid or inactive API key"
      ) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 401 },
        )
      }

      // Handle other potential database errors during validation/usage fetch
      console.error("Database operation error during check:", error)
      return NextResponse.json(
        { success: false, error: "Database operation failed during check" },
        { status: 500 },
      )
    }
  } catch (error) {
    // Catch unexpected errors in the overall request handling
    console.error("Error in magic/check endpoint:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    )
  }
}
