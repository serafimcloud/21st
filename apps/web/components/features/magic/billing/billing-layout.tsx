import { auth } from "@clerk/nextjs/server"
import { PlanSkeleton } from "./plan-skeleton"
import { PaymentManagementCard } from "./payment-management-card"
import { BillingClientWrapper } from "./billing-client-wrapper"

interface PlanInfo {
  name: string
  type: "free" | "standard" | "pro"
  period?: string | null
  periodEnd?: string | null
}

async function getCurrentPlan(userId: string | null): Promise<PlanInfo | null> {
  if (!userId) {
    return { name: "Free Plan", type: "free" }
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/subscription/current-plan`,
      {
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      console.error("Failed to fetch current plan:", response.statusText)
      return { name: "Free Plan", type: "free" }
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching current plan:", error)
    return { name: "Free Plan", type: "free" }
  }
}

export async function BillingLayout() {
  const { userId } = await auth()
  const currentPlan = await getCurrentPlan(userId)

  if (!currentPlan) {
    return <PlanSkeleton />
  }

  return (
    <div className="relative">
      <div className="mx-auto max-w-[1200px] px-2 sm:px-4">
        <div className="border-b pb-4 mb-8">
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight pt-10">
            Subscription Management
          </h1>
          <p className="text-muted-foreground">
            View your current plan and manage your subscription
          </p>
        </div>

        <div className="space-y-8">
          {/* Current Plan Section */}
          <div>
            <div className="space-y-2 mb-4">
              <h3 className="text-base sm:text-lg font-semibold leading-tight sm:leading-none tracking-tight">
                Current Plan
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Information about your current subscription
              </p>
            </div>
            <div className="w-full overflow-hidden">
              <div className="max-w-full overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
                <BillingClientWrapper
                  userId={userId}
                  currentPlan={currentPlan}
                />
              </div>
            </div>
          </div>

          {/* Payment Management Section - Only for paid plans */}
          {currentPlan.type !== "free" && (
            <div>
              <div className="space-y-2 mb-4">
                <h3 className="text-base sm:text-lg font-semibold leading-tight sm:leading-none tracking-tight">
                  Payment Management
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  View payment history and manage payment methods
                </p>
              </div>
              <div className="w-full overflow-hidden">
                <div className="max-w-full overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
                  <PaymentManagementCard />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
