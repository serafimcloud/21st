import { NextRequest, NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { FREE_USAGE_LIMIT } from "@/lib/config/subscription-plans"

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

    try {
      // Check API key in api_keys table
      const { data: apiKeyData, error: apiKeyError } =
        await supabaseWithAdminAccess
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

      const userId = apiKeyData.user_id

      // Check available requests in usages table
      let { data: usageData, error: usageError } = await supabaseWithAdminAccess
        .from("usages")
        .select("*")
        .eq("user_id", userId)
        .single()

      // If error is not "record not found", it's a genuine error
      if (usageError && usageError.code !== "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Failed to check usage limits" },
          { status: 500 },
        )
      }

      // If no record exists, create one with default values
      if (!usageData) {
        const { data: newUsage, error: insertError } =
          await supabaseWithAdminAccess
            .from("usages")
            .insert({
              user_id: userId,
              usage: 0,
              limit: FREE_USAGE_LIMIT,
            })
            .select()
            .single()

        if (insertError) {
          return NextResponse.json(
            { success: false, error: "Failed to create usage record" },
            { status: 500 },
          )
        }

        // Use the newly created record
        usageData = newUsage
      }

      // Current usage values and limit
      const currentUsage = usageData?.usage || 0
      const usageLimit = usageData?.limit || 0

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
      const { error: updateError } = await supabaseWithAdminAccess
        .from("usages")
        .update({
          usage: currentUsage + 1,
        })
        .eq("user_id", userId)

      if (updateError) {
        return NextResponse.json(
          { success: false, error: "Failed to update usage count" },
          { status: 500 },
        )
      }

      // Update last_used_at for API key
      await supabaseWithAdminAccess
        .from("api_keys")
        .update({
          last_used_at: new Date().toISOString(),
          requests_count: (apiKeyData.requests_count || 0) + 1,
        })
        .eq("id", apiKeyData.id)

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
