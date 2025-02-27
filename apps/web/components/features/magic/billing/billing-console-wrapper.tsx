"use client"

import { CurrentPlanCard } from "./current-plan-card"
import { PlanSelectorDialog } from "./plan-selector-dialog"
import { PaymentManagementCard } from "./payment-management-card"
import { useState, useEffect } from "react"
import { PlanSkeleton } from "./plan-skeleton"
import { toast } from "sonner"

interface PlanInfo {
  name: string
  type: "free" | "standard" | "pro"
  period?: string | null
  periodEnd?: string | null
}

interface CachedPlanData {
  plan: PlanInfo
  timestamp: number
}

interface BillingConsoleWrapperProps {
  userId: string | null
}

// Время жизни кеша в миллисекундах (5 минут)
const CACHE_TTL = 5 * 60 * 1000

export function BillingConsoleWrapper({ userId }: BillingConsoleWrapperProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<PlanInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Определяем, показывать ли секцию управления платежами
  const showPaymentSection =
    !isLoading && currentPlan && currentPlan.type !== "free"

  useEffect(() => {
    async function fetchCurrentPlan() {
      if (!userId) {
        setCurrentPlan({ name: "Free Plan", type: "free" })
        setIsLoading(false)
        return
      }

      // Проверяем кеш
      const cachedData = getCachedPlan(userId)
      if (cachedData) {
        setCurrentPlan(cachedData)
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch("/api/subscription/current-plan")
        if (!response.ok) {
          throw new Error("Failed to fetch current plan")
        }

        const planData = await response.json()
        setCurrentPlan(planData)

        // Сохраняем в кеш
        cachePlan(userId, planData)
      } catch (error) {
        console.error("Error fetching current plan:", error)
        setCurrentPlan({ name: "Free Plan", type: "free" })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCurrentPlan()
  }, [userId])

  // Функция для получения данных из кеша
  function getCachedPlan(userId: string): PlanInfo | null {
    if (typeof window === "undefined") return null

    try {
      const cacheKey = `billing_plan_${userId}`
      const cachedDataStr = localStorage.getItem(cacheKey)

      if (!cachedDataStr) return null

      const cachedData: CachedPlanData = JSON.parse(cachedDataStr)
      const now = Date.now()

      // Проверяем, не истек ли срок действия кеша
      if (now - cachedData.timestamp > CACHE_TTL) {
        localStorage.removeItem(cacheKey)
        return null
      }

      return cachedData.plan
    } catch (error) {
      console.error("Error reading from cache:", error)
      return null
    }
  }

  // Функция для сохранения данных в кеш
  function cachePlan(userId: string, plan: PlanInfo): void {
    if (typeof window === "undefined") return

    try {
      const cacheKey = `billing_plan_${userId}`
      const cacheData: CachedPlanData = {
        plan,
        timestamp: Date.now(),
      }

      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (error) {
      console.error("Error saving to cache:", error)
    }
  }

  // Функция для обновления плана и кеша
  const handlePlanUpdated = (newPlan: PlanInfo) => {
    setCurrentPlan(newPlan)
    if (userId) {
      cachePlan(userId, newPlan)
      toast.success(`Successfully updated to ${newPlan.name}`)
    }
  }

  // Функция для принудительного обновления данных о плане
  const refreshPlanData = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/subscription/current-plan")
      if (!response.ok) {
        throw new Error("Failed to fetch current plan")
      }

      const planData = await response.json()
      setCurrentPlan(planData)

      // Обновляем кеш
      cachePlan(userId, planData)
      toast.success("Subscription information updated")
    } catch (error) {
      console.error("Error refreshing plan data:", error)
      toast.error("Failed to refresh subscription data")
    } finally {
      setIsLoading(false)
    }
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
                {isLoading ? (
                  <PlanSkeleton />
                ) : currentPlan ? (
                  <CurrentPlanCard
                    currentPlan={currentPlan}
                    onManagePlan={() => setIsDialogOpen(true)}
                    onRefresh={refreshPlanData}
                  />
                ) : null}
              </div>
            </div>
          </div>

          {/* Payment Management Section - Only for paid plans */}
          {showPaymentSection && (
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

      <PlanSelectorDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        userId={userId}
        onPlanUpdated={handlePlanUpdated}
      />
    </div>
  )
}
