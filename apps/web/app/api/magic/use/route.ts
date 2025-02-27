import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

export async function GET(request: NextRequest) {
  try {
    // Get API key from query parameters or headers
    const { searchParams } = new URL(request.url)
    const apiKey =
      searchParams.get("apikey") || request.headers.get("x-api-key")

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing API key" },
        { status: 401 },
      )
    }

    // Initialize Supabase client
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    })

    try {
      // Check API key in api_keys table
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from("api_keys")
        .select("*")
        .eq("key", apiKey)
        .eq("is_active", true)
        .single()

      // If key is not found or inactive
      if (apiKeyError || !apiKeyData) {
        return NextResponse.json(
          { success: false, error: "Invalid or inactive API key" },
          { status: 401 },
        )
      }

      const userId = apiKeyData.user_id as string

      // Check available requests in usages table
      const { data: usageData, error: usageError } = await supabase
        .from("usages")
        .select("*")
        .eq("user_id", userId)
        .single()

      // If record not found or error occurred
      if (usageError) {
        return NextResponse.json(
          { success: false, error: "Failed to check usage limits" },
          { status: 500 },
        )
      }

      // If no record exists, user has no limits (until we create a record)
      if (!usageData) {
        return NextResponse.json(
          { success: false, error: "No usage record found for this user" },
          { status: 404 },
        )
      }

      // Current usage values and limit
      const currentUsage = (usageData.usage as number) || 0
      const usageLimit = (usageData.limit as number) || 0

      // Check if user has exceeded the limit
      if (currentUsage >= usageLimit) {
        return NextResponse.json(
          {
            success: false,
            error: "Usage limit exceeded",
            usage: currentUsage,
            limit: usageLimit,
            remaining: 0,
          },
          { status: 403 },
        )
      }

      // Update usage counter
      const { error: updateError } = await supabase
        .from("usages")
        .update({
          usage: currentUsage + 1,
        } as any)
        .eq("user_id", userId)

      if (updateError) {
        return NextResponse.json(
          { success: false, error: "Failed to update usage count" },
          { status: 500 },
        )
      }

      // Update last_used_at for API key
      await supabase
        .from("api_keys")
        .update({
          last_used_at: new Date().toISOString(),
          requests_count: ((apiKeyData.requests_count as number) || 0) + 1,
        } as any)
        .eq("id", apiKeyData.id as string)

      // Return successful response
      return NextResponse.json({
        success: true,
        message: "API key is valid and usage updated",
        usage: currentUsage + 1,
        limit: usageLimit,
        remaining: usageLimit - (currentUsage + 1),
      })
    } catch (error) {
      console.error("Supabase operation error:", error)
      return NextResponse.json(
        { success: false, error: "Database operation failed" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in magic/use endpoint:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    )
  }
}
