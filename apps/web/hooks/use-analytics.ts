import { createClient } from "@supabase/supabase-js"
import { useCallback, useEffect, useState } from "react"
import { AnalyticsActivityType } from "@/types/global"
// Type guard for runtime checking
function isValidActivityType(type: string): type is AnalyticsActivityType {
  return Object.values(AnalyticsActivityType).includes(
    type as AnalyticsActivityType,
  )
}

// Initialize Supabase client with anon key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!,
)

// Anonymous user ID generator
const generateAnonId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  )
}

export function useSupabaseAnalytics() {
  const [anonId, setAnonId] = useState<string | null>(null)

  // Initialize or retrieve the anonymous ID
  useEffect(() => {
    if (typeof window === "undefined") return

    let storedAnonId = localStorage.getItem("21st_anon_id")
    if (!storedAnonId) {
      storedAnonId = generateAnonId()
      localStorage.setItem("21st_anon_id", storedAnonId)
    }
    setAnonId(storedAnonId)
  }, [])

  const capture = useCallback(
    async (
      component_id: number,
      activity_type: AnalyticsActivityType,
      user_id?: string,
    ) => {
      // Skip analytics in development mode
      if (process.env.NODE_ENV === "development") {
        return
      }

      try {
        // Runtime type check
        if (!isValidActivityType(activity_type)) {
          throw new Error(`Invalid activity type: ${activity_type}`)
        }

        // Determine identifier for checking duplicates - either user_id or anonymous ID
        const identifier = user_id || anonId

        if (!identifier) {
          // Skip recording if we have no way to identify the user (incognito mode, etc.)
          console.debug("No user identifier available")
          return
        }

        // Check if this user/anon has performed this action in the last 24 hours
        const oneDayAgo = new Date()
        oneDayAgo.setDate(oneDayAgo.getDate() - 1)

        const { data: existingEvents } = await supabase
          .from("component_analytics")
          .select("id")
          .eq("component_id", component_id)
          .eq("activity_type", activity_type)
          .or(
            `user_id.eq.${user_id ? user_id : ""}, anon_id.eq.${!user_id && anonId ? anonId : ""}`,
          )
          .gte("created_at", oneDayAgo.toISOString())
          .limit(1)

        // If a duplicate event is found, don't record it again
        if (existingEvents && existingEvents.length > 0) {
          return
        }

        // No existing event found within the timeframe, insert the new event
        await insertAnalyticsEvent(component_id, activity_type, user_id, anonId)
      } catch (err) {
        console.error("Analytics capture error:", err)
      }
    },
    [anonId],
  )

  // Helper function to insert analytics event
  const insertAnalyticsEvent = async (
    component_id: number,
    activity_type: AnalyticsActivityType,
    user_id?: string,
    anon_id?: string | null,
  ) => {
    return supabase
      .from("component_analytics")
      .insert({
        component_id,
        activity_type,
        created_at: new Date().toISOString(),
        user_id,
        anon_id: !user_id ? anon_id : undefined, // Only store anon_id if user_id is not provided
      })
      .then(({ error }) => {
        if (error) {
          console.error("Analytics capture failed:", error)
        }
      })
  }

  return { capture }
}
