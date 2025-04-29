import { NextRequest, NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { isAfter } from "date-fns"
import { stripeV1, stripeV2, getAllPlans } from "@/lib/stripe"

// Define types for our meta object
interface SubscriptionMeta {
  stripe_customer_id?: string
  stripe_subscription_id?: string
  stripe_plan_id?: string
  period_end?: string
  will_cancel_at_end?: boolean
  cancel_at?: string | null
  [key: string]: any
}

/**
 * Resets usage for all users at the beginning of the month
 */
async function resetAllUsages() {
  try {
    const { error } = await supabaseWithAdminAccess
      .from("usages")
      .update({ usage: 0 })
      .neq("usage", 0) // Only update records that need to be reset

    if (error) {
      throw new Error(`Failed to reset usages: ${error.message}`)
    }

    return { success: true, message: "All usages reset successfully" }
  } catch (error) {
    console.error("Error resetting usages:", error)
    throw error
  }
}

/**
 * Updates subscription statuses based on period_end and other metadata
 */
async function updateSubscriptionStatuses() {
  try {
    const now = new Date()

    // Get all plans for reference
    const allPlans = await getAllPlans()

    // Get all active subscriptions
    const { data: activeSubscriptions, error } = await supabaseWithAdminAccess
      .from("users_to_plans")
      .select(
        `
        *,
        plans:plan_id (
          id,
          stripe_plan_id,
          price,
          env,
          period,
          type,
          add_usage,
          version
        )
      `,
      )
      .eq("status", "active")

    if (error) {
      throw new Error(`Failed to fetch active subscriptions: ${error.message}`)
    }

    let updated = 0
    let expired = 0

    // Process each subscription
    for (const subscription of activeSubscriptions || []) {
      try {
        // Skip if user_id is null
        if (!subscription.user_id) continue

        // Parse meta object with proper typing
        const meta = (
          typeof subscription.meta === "object" ? subscription.meta : {}
        ) as SubscriptionMeta
        const periodEnd = meta.period_end ? new Date(meta.period_end) : null

        // Skip if no period_end (shouldn't happen for valid subscriptions)
        if (!periodEnd) continue

        // Get plan version and determine which Stripe instance to use
        const plansData = subscription.plans as any
        const planVersion = plansData?.version || 1
        const stripeInstance = planVersion === 1 ? stripeV1 : stripeV2

        // Check if subscription period has ended
        if (isAfter(now, periodEnd)) {
          if (meta.will_cancel_at_end) {
            // Subscription was set to cancel - mark as inactive
            await supabaseWithAdminAccess
              .from("users_to_plans")
              .update({
                status: "inactive",
                updated_at: now.toISOString(),
              })
              .eq("user_id", subscription.user_id)

            // Reset to free tier usage limits
            const freePlan = allPlans.find((plan) => plan.type === "free")
            if (freePlan) {
              await supabaseWithAdminAccess
                .from("usages")
                .update({ limit: freePlan.add_usage || 0 })
                .eq("user_id", subscription.user_id)
            }

            expired++
          } else {
            // Verify with Stripe that subscription is still active
            try {
              if (meta.stripe_subscription_id) {
                const stripeSubscription =
                  await stripeInstance.subscriptions.retrieve(
                    meta.stripe_subscription_id,
                  )

                // If subscription is still active in Stripe, update the period_end locally
                if (stripeSubscription.status === "active") {
                  const newPeriodEnd = new Date(
                    stripeSubscription.current_period_end * 1000,
                  )

                  // Update the meta with new period_end
                  const updatedMeta: SubscriptionMeta = {
                    ...(typeof meta === "object" ? meta : {}),
                    period_end: newPeriodEnd.toISOString(),
                  }

                  await supabaseWithAdminAccess
                    .from("users_to_plans")
                    .update({
                      meta: updatedMeta,
                      updated_at: now.toISOString(),
                      last_paid_at: now.toISOString(),
                    })
                    .eq("user_id", subscription.user_id)

                  updated++
                } else {
                  // Subscription is no longer active in Stripe
                  await supabaseWithAdminAccess
                    .from("users_to_plans")
                    .update({
                      status: "inactive",
                      updated_at: now.toISOString(),
                    })
                    .eq("user_id", subscription.user_id)

                  // Reset to free tier usage limits
                  const freePlan = allPlans.find((plan) => plan.type === "free")
                  if (freePlan) {
                    await supabaseWithAdminAccess
                      .from("usages")
                      .update({ limit: freePlan.add_usage || 0 })
                      .eq("user_id", subscription.user_id)
                  }

                  expired++
                }
              }
            } catch (error) {
              console.error(
                `Error verifying subscription with Stripe: ${error}`,
              )
              // If we can't verify with Stripe, assume the worst and mark as inactive
              await supabaseWithAdminAccess
                .from("users_to_plans")
                .update({
                  status: "inactive",
                  updated_at: now.toISOString(),
                })
                .eq("user_id", subscription.user_id)

              expired++
            }
          }
        }
      } catch (subError) {
        console.error(
          `Error processing subscription for user ${subscription.user_id}:`,
          subError,
        )
        // Continue processing other subscriptions
      }
    }

    return {
      success: true,
      updated,
      expired,
      message: `Processed ${activeSubscriptions?.length || 0} subscriptions: ${updated} updated, ${expired} expired`,
    }
  } catch (error) {
    console.error("Error updating subscription statuses:", error)
    throw error
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Validate the request has the correct authorization header
    const authHeader = req.headers.get("Authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Execute the cron job tasks
    const usageResults = await resetAllUsages()
    const subscriptionResults = await updateSubscriptionStatuses()

    return NextResponse.json({
      success: true,
      usageResults,
      subscriptionResults,
    })
  } catch (error: any) {
    console.error("Error in cron job:", error)
    return NextResponse.json(
      { error: `Cron job error: ${error.message}` },
      { status: 500 },
    )
  }
}
