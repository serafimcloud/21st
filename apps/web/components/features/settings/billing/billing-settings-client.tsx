"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { LoaderCircle, ExternalLink, ArrowRight, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PlanSelectorDialog } from "@/components/features/settings/billing/plan-selector-dialog"
import { PLAN_LIMITS, PlanType } from "@/lib/subscription-limits"
import {
  PricingTable,
  PricingFeature,
  PricingPlan,
  PlanLevel,
} from "@/components/ui/pricing-table"

interface PlanInfo {
  name: string
  type: "free" | "standard" | "pro"
  period?: string | null
  periodEnd?: string | null
  usage_count?: number
  current_period_end?: string
  cancel_at_period_end?: boolean
  portal_url?: string
}

interface BillingSettingsClientProps {
  subscription: PlanInfo | null
}

// Глобальное состояние для отображения таблицы планов
let showPricingTableGlobal = false
let setShowPricingTableGlobal: (value: boolean) => void = () => {}

// Компонент для отображения таблицы планов из сервер-компонента
export function AllPlansTrigger() {
  return <AllPlansButton onClick={() => setShowPricingTableGlobal(true)} />
}

// Выносим компонент кнопки в отдельную экспортируемую функцию
export function AllPlansButton({ onClick }: { onClick?: () => void }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs flex items-center gap-1"
        onClick={onClick || (() => setIsDialogOpen(true))}
      >
        All plans <ArrowRight size={12} className="ml-1" />
      </Button>

      {!onClick && (
        <PlanSelectorDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          currentPlan="free" // Будет перезаписано при рендере основного компонента
        />
      )}
    </>
  )
}

export function BillingSettingsClient({
  subscription,
}: BillingSettingsClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isUpgradeLoading, setIsUpgradeLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showPricingTable, setShowPricingTable] = useState(
    showPricingTableGlobal,
  )

  // Устанавливаем глобальное состояние
  setShowPricingTableGlobal = setShowPricingTable

  const handleCancelSubscription = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to cancel subscription")
      }

      toast.success("Subscription successfully canceled")
      router.refresh()
    } catch (error) {
      console.error("Error cancelling subscription:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to cancel subscription. Please try again later.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Функция для направления пользователя на страницу оплаты Stripe
  const handleUpgradePlan = async (planId: PlanType) => {
    setIsUpgradeLoading(true)
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          period: "monthly", // По умолчанию используем месячный период
          successUrl: `${window.location.origin}/settings/billing?success=true`,
          cancelUrl: `${window.location.origin}/settings/billing?canceled=true`,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create checkout session")
      }

      const { url } = await response.json()
      window.location.href = url // Перенаправление на страницу оплаты Stripe
    } catch (error) {
      console.error("Error creating checkout session:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to initiate upgrade process. Please try again later.",
      )
    } finally {
      setIsUpgradeLoading(false)
    }
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <div className="bg-background rounded-lg border border-border p-8 flex items-center justify-center">
          <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  const currentPlanId: PlanType = (subscription?.type as PlanType) || "free"
  const usageCount = subscription?.usage_count || 0

  // Определяем, какой план показывать в качестве upgrade
  let upgradePlanId: PlanType | null = null
  if (currentPlanId === "free") {
    upgradePlanId = "standard"
  } else if (currentPlanId === "standard") {
    upgradePlanId = "pro"
  }

  // Данные для компонента PricingTable с конкретными значениями вместо галочек
  const pricingFeatures: PricingFeature[] = [
    {
      name: "Monthly generations",
      included: "free",
      valueByPlan: {
        free: PLAN_LIMITS.free.generationsPerMonth.toString(),
        standard: PLAN_LIMITS.standard.generationsPerMonth.toString(),
        pro: PLAN_LIMITS.pro.generationsPerMonth.toString(),
      },
    },
    {
      name: "Basic components",
      included: "free",
      valueByPlan: {
        free: "✓",
        standard: "✓",
        pro: "✓",
      },
    },
    {
      name: "Community support",
      included: "free",
      valueByPlan: {
        free: "✓",
        standard: "✓",
        pro: "✓",
      },
    },
    {
      name: "Multi-language support",
      included: "standard",
      valueByPlan: {
        free: "-",
        standard: "✓",
        pro: "✓",
      },
    },
    {
      name: "Basic analytics",
      included: "standard",
      valueByPlan: {
        free: "-",
        standard: "✓",
        pro: "✓",
      },
    },
    {
      name: "Priority support",
      included: "standard",
      valueByPlan: {
        free: "-",
        standard: "✓",
        pro: "✓",
      },
    },
    {
      name: "Advanced analytics",
      included: "pro",
      valueByPlan: {
        free: "-",
        standard: "-",
        pro: "✓",
      },
    },
    {
      name: "Custom integrations",
      included: "pro",
      valueByPlan: {
        free: "-",
        standard: "-",
        pro: "✓",
      },
    },
    {
      name: "24/7 phone support",
      included: "pro",
      valueByPlan: {
        free: "-",
        standard: "-",
        pro: "✓",
      },
    },
  ]

  const pricingPlans: PricingPlan[] = [
    {
      name: PLAN_LIMITS.free.displayName,
      level: "free",
      price: { monthly: 0, yearly: 0 },
    },
    {
      name: PLAN_LIMITS.standard.displayName,
      level: "standard",
      price: { monthly: 10, yearly: 100 },
      popular: true,
    },
    {
      name: PLAN_LIMITS.pro.displayName,
      level: "pro",
      price: { monthly: 30, yearly: 300 },
    },
  ]

  const handlePlanSelect = (plan: PlanLevel) => {
    const selectedPlanId = plan as PlanType

    if (selectedPlanId === currentPlanId) {
      // Если выбран текущий план, просто закрываем таблицу
      setShowPricingTable(false)
      return
    }

    if (selectedPlanId === "free" && currentPlanId !== "free") {
      // Даунгрейд до бесплатного плана
      handleCancelSubscription()
    } else if (selectedPlanId !== "free") {
      // Апгрейд на платный план
      handleUpgradePlan(selectedPlanId as PlanType)
    }

    setShowPricingTable(false)
  }

  // Если показываем таблицу цен
  if (showPricingTable) {
    return (
      <div className="space-y-6">
        <PricingTable
          features={pricingFeatures}
          plans={pricingPlans}
          defaultPlan={currentPlanId}
          defaultInterval="monthly"
          onPlanSelect={handlePlanSelect}
          onBack={() => setShowPricingTable(false)}
          buttonClassName={`${currentPlanId === "pro" ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"}`}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Block */}
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="p-4 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">
                {PLAN_LIMITS[currentPlanId].displayName}
              </h3>
              <span className="bg-accent/30 text-accent-foreground px-2 py-0.5 rounded-full text-xs">
                Current plan
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {PLAN_LIMITS[currentPlanId].description}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Usage</div>
            <div className="text-sm font-medium">
              {usageCount} / {PLAN_LIMITS[currentPlanId].generationsPerMonth}{" "}
              generations
            </div>
          </div>
        </div>

        {/* Features of current plan */}
        <div className="px-4 pb-4 grid grid-cols-2 gap-x-8 gap-y-1">
          {PLAN_LIMITS[currentPlanId].features.map((feature, index) => (
            <div key={index} className="flex items-center gap-1">
              <Check className="h-3 w-3 text-primary flex-shrink-0" />
              <span className="text-xs">{feature}</span>
            </div>
          ))}
        </div>

        {subscription?.current_period_end && (
          <div className="px-4 pb-4">
            <p className="text-xs text-muted-foreground">
              Active until{" "}
              {new Date(subscription.current_period_end).toLocaleDateString()}
              {subscription.cancel_at_period_end &&
                " (will be canceled at the end of period)"}
            </p>
          </div>
        )}
      </div>

      {/* Upgrade Plan Block - показываем только если есть вариант для апгрейда */}
      {upgradePlanId && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            Upgrade to {PLAN_LIMITS[upgradePlanId].displayName}
          </h3>

          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="p-4 flex justify-between items-start">
              <div>
                <h4 className="text-sm font-medium">
                  ${upgradePlanId === "standard" ? "10" : "30"} per month
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {PLAN_LIMITS[upgradePlanId].description}
                </p>
              </div>
              <Button
                size="sm"
                className="h-8 text-xs"
                disabled={isUpgradeLoading}
                onClick={() => handleUpgradePlan(upgradePlanId as PlanType)}
              >
                {isUpgradeLoading ? (
                  <>
                    <LoaderCircle className="mr-2 h-3 w-3 animate-spin" />
                    Processing
                  </>
                ) : (
                  "Upgrade plan"
                )}
              </Button>
            </div>

            {/* Улучшения по сравнению с текущим планом */}
            <div className="px-4 pb-4">
              <p className="text-xs font-medium mb-2">
                What you get compared to your current plan:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                {/* Highlight key improvements between plans */}
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span className="text-xs">
                    <strong>
                      {PLAN_LIMITS[upgradePlanId].generationsPerMonth -
                        PLAN_LIMITS[currentPlanId].generationsPerMonth}
                    </strong>{" "}
                    additional generations per month
                  </span>
                </div>

                {/* Additional features unique to the upgrade plan */}
                {PLAN_LIMITS[upgradePlanId].features
                  .filter(
                    (feature) =>
                      !PLAN_LIMITS[currentPlanId].features.includes(feature),
                  )
                  .map((feature, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span className="text-xs">{feature}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Payment history</h3>
        <div className="bg-background rounded-lg border border-border min-h-24 flex items-center justify-center p-6">
          <p className="text-xs text-muted-foreground">No invoices yet</p>
        </div>
      </div>

      {/* Stripe Portal / Cancel Subscription */}
      {currentPlanId !== "free" && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Manage subscription</h3>
          <div className="bg-background rounded-lg border border-border p-4">
            <div className="flex flex-col space-y-4">
              {subscription?.portal_url && (
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs flex items-center w-full sm:w-auto"
                    onClick={() =>
                      window.open(subscription.portal_url, "_blank")
                    }
                  >
                    <ExternalLink className="mr-2 h-3 w-3" />
                    Manage payment details
                  </Button>
                </div>
              )}

              {!subscription?.cancel_at_period_end && (
                <div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 text-xs w-full sm:w-auto"
                    disabled={isLoading}
                    onClick={handleCancelSubscription}
                  >
                    {isLoading ? (
                      <>
                        <LoaderCircle className="mr-2 h-3 w-3 animate-spin" />
                        Processing
                      </>
                    ) : (
                      "Cancel subscription"
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your subscription will remain active until the end of your
                    current billing period.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <PlanSelectorDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        currentPlan={currentPlanId}
      />
    </div>
  )
}

// Добавляем статический метод к компоненту BillingSettingsClient
BillingSettingsClient.AllPlansTrigger = AllPlansTrigger
