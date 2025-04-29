"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { LoaderCircle, ExternalLink, ArrowRight, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  PLAN_LIMITS,
  PlanType,
  PLAN_FEATURES,
  PRICING_PLANS,
} from "@/lib/config/subscription-plans"
import {
  PricingTable,
  PlanLevel,
} from "@/components/features/settings/billing/pricing-table"
import { BillingHeader } from "@/components/features/settings/billing/billing-header"
import { ConfirmationDialog } from "@/components/features/settings/billing/confirmation-dialog"
import { UpgradeConfirmationDialog } from "@/components/features/settings/billing/upgrade-confirmation-dialog"
import { InvoicesList } from "@/components/features/settings/billing/invoices-list"
import { useSubscription, PlanInfo } from "@/hooks/use-subscription"
import { CircleProgress } from "@/components/ui/circle-progress"
import {
  trackAttribution,
  ATTRIBUTION_SOURCE,
  SOURCE_DETAIL,
} from "@/lib/attribution-tracking"

interface Invoice {
  id: string
  number: string
  created: number
  amount_paid: number
  status: string
  period_start: number
  period_end: number
  invoice_pdf: string | null
  currency: string
}

interface BillingSettingsClientProps {
  subscription: PlanInfo | null
  successParam?: boolean
  canceledParam?: boolean
}

let showPricingTableGlobal = false
let setShowPricingTableGlobal: (value: boolean) => void = () => {}

export function AllPlansTrigger() {
  return <AllPlansButton onClick={() => setShowPricingTableGlobal(true)} />
}

export function AllPlansButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      variant="outline"
      className="flex items-center gap-1"
      onClick={onClick}
    >
      All plans <ArrowRight size={12} className="ml-1" />
    </Button>
  )
}

export function BillingSettingsClient({
  subscription: initialSubscription,
  successParam = false,
  canceledParam = false,
}: BillingSettingsClientProps) {
  const [subscription, setSubscription] = useState(initialSubscription)
  const { fetchSubscription } = useSubscription()
  const [isLoading, setIsLoading] = useState(false)
  const [isUpgradeLoading, setIsUpgradeLoading] = useState(false)
  const [showPricingTable, setShowPricingTable] = useState(
    showPricingTableGlobal,
  )
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
    isLoading: boolean
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
    isLoading: false,
  })
  const [upgradeConfirmation, setUpgradeConfirmation] = useState<{
    open: boolean
    planId: PlanType
  }>({
    open: false,
    planId: "pro",
  })
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)

  const currentPlanId = (subscription?.type as PlanType) || "free"
  const usageCount = subscription?.usage || 0
  const usageLimit =
    subscription?.limit || PLAN_LIMITS[currentPlanId].generationsPerMonth

  // Set global state
  setShowPricingTableGlobal = setShowPricingTable

  // Show toast when successParam or canceledParam is true and refresh data
  useEffect(() => {
    if (successParam) {
      toast.success("Processing payment", {
        description: "Your subscription is being processed",
        duration: 5000,
      })

      // Remove success parameter from URL without page reload
      const url = new URL(window.location.href)
      url.searchParams.delete("success")
      window.history.replaceState({}, "", url)

      // Add delay to allow Stripe webhook to process
      const timer = setTimeout(async () => {
        const newSubscription = await fetchSubscription()
        if (newSubscription) {
          setSubscription(newSubscription)
        }
      }, 2000)
      return () => clearTimeout(timer)
    }

    if (canceledParam) {
      toast.error("Payment canceled", {
        description: "Your subscription change was canceled",
        duration: 5000,
      })

      // Remove canceled parameter from URL without page reload
      const url = new URL(window.location.href)
      url.searchParams.delete("canceled")
      window.history.replaceState({}, "", url)
    }
  }, [successParam, canceledParam, fetchSubscription])

  useEffect(() => {
    if (subscription && currentPlanId !== "free") {
      fetchInvoices()
    }
  }, [subscription])

  const fetchInvoices = async () => {
    setIsLoadingInvoices(true)
    try {
      const response = await fetch("/api/stripe/get-invoices")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch invoices")
      }

      const data = await response.json()
      setInvoices(data.invoices || [])
    } catch (error) {
      toast.error("Failed to load payment history. Please try again later.")
    } finally {
      setIsLoadingInvoices(false)
    }
  }

  const handleCancelSubscription = async () => {
    // Track attribution when subscription is cancelled
    trackAttribution(
      ATTRIBUTION_SOURCE.SETTINGS,
      SOURCE_DETAIL.SETTINGS_BILLING,
    )

    setIsLoading(true)
    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to downgrade subscription")
      }

      toast.success("Plan successfully downgraded", {
        description:
          "Your subscription will be downgraded to Free plan at the end of the billing period",
        duration: 5000,
      })
      setConfirmationDialog((prev) => ({ ...prev, open: false }))

      // Оптимистично обновляем состояние подписки
      if (subscription) {
        setSubscription({
          ...subscription,
          cancel_at_period_end: true,
        })
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to downgrade subscription. Please try again later.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgradePlan = async (
    planId: PlanType,
    period: "monthly" | "yearly" = "monthly",
  ) => {
    // Track attribution when plan is upgraded with plan ID and current subscription info
    trackAttribution(
      ATTRIBUTION_SOURCE.SETTINGS,
      SOURCE_DETAIL.SETTINGS_BILLING,
    )

    setIsUpgradeLoading(true)
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          period,
          successUrl: `${window.location.origin}/settings/billing?success=true`,
          cancelUrl: `${window.location.origin}/settings/billing?canceled=true`,
          isUpgrade: true,
          currentPlanId: currentPlanId,
          subscriptionId: subscription?.stripe_subscription_id,
          attributionSource: ATTRIBUTION_SOURCE.SETTINGS,
          sourceDetail: SOURCE_DETAIL.SETTINGS_BILLING,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create checkout session")
      }

      const data = await response.json()

      if (data.directly_upgraded) {
        const planOrder = { pro_plus: 3, pro: 2, free: 1 }
        const isDowngrade = planOrder[planId] < planOrder[currentPlanId]

        toast.success(
          isDowngrade
            ? "Plan successfully downgraded"
            : "Plan successfully upgraded",
          {
            description: isDowngrade
              ? "Your subscription will be changed at the end of your current billing period"
              : "Your subscription has been upgraded to the new plan",
            duration: 5000,
          },
        )

        // Оптимистично обновляем состояние подписки
        if (subscription) {
          setSubscription({
            ...subscription,
            type: planId,
            period: period,
            cancel_at_period_end: false,
          })
        }
      } else {
        window.location.href = data.url
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to initiate plan change process. Please try again later.",
      )
    } finally {
      setIsUpgradeLoading(false)
    }
  }

  const confirmUpgrade = (planId: PlanType) => {
    // Track attribution when upgrade button is clicked
    trackAttribution(
      ATTRIBUTION_SOURCE.SETTINGS,
      SOURCE_DETAIL.SETTINGS_BILLING,
    )

    setUpgradeConfirmation({
      open: true,
      planId,
    })
  }

  // Show loading state while subscription data is being fetched
  if (!subscription) {
    return (
      <div className="space-y-6">
        <div className="bg-background rounded-lg border border-border p-8 flex items-center justify-center">
          <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  const handlePlanSelect = async (plan: PlanLevel, isYearly = false) => {
    const selectedPlanId = plan as PlanType

    // Track attribution when plan is selected
    trackAttribution(
      ATTRIBUTION_SOURCE.SETTINGS,
      SOURCE_DETAIL.SETTINGS_BILLING,
    )

    if (
      selectedPlanId === currentPlanId &&
      isYearly === (subscription?.period === "yearly")
    ) {
      // If current plan with same period is selected, just close the table
      setShowPricingTable(false)
      return
    }

    // If same plan but different billing period
    if (
      selectedPlanId === currentPlanId &&
      isYearly !== (subscription?.period === "yearly")
    ) {
      await handleUpgradePlan(selectedPlanId, isYearly ? "yearly" : "monthly")
      setShowPricingTable(false)
      return
    }

    // Check if it's a downgrade (moving to a lower tier plan)
    const planOrder = { pro_plus: 3, pro: 2, free: 1 }
    const isDowngrade = planOrder[selectedPlanId] < planOrder[currentPlanId]

    if (isDowngrade) {
      // Show confirmation dialog for downgrade
      setConfirmationDialog({
        open: true,
        title: "Confirm Plan Downgrade",
        description: `Are you sure you want to downgrade to the ${PLAN_LIMITS[selectedPlanId].displayName} plan? You will lose access to some features at the end of your current billing period.`,
        isLoading: false,
        onConfirm: async () => {
          try {
            setConfirmationDialog((prev) => ({ ...prev, isLoading: true }))
            if (selectedPlanId === "free") {
              await handleCancelSubscription()
            } else {
              await handleUpgradePlan(
                selectedPlanId,
                isYearly ? "yearly" : "monthly",
              )
            }
          } finally {
            setConfirmationDialog((prev) => ({
              ...prev,
              isLoading: false,
              open: false,
            }))
          }
        },
      })
    } else if (selectedPlanId !== "free") {
      // Upgrade to higher plan
      await handleUpgradePlan(selectedPlanId, isYearly ? "yearly" : "monthly")
    }

    setShowPricingTable(false)
  }

  // Determine which plan to show as upgrade
  let upgradePlanId: PlanType | null = null
  if (currentPlanId === "free") {
    upgradePlanId = "pro"
  } else if (currentPlanId === "pro") {
    upgradePlanId = "pro_plus"
  }

  // If showing pricing table
  if (showPricingTable) {
    return (
      <div className="space-y-6">
        <PricingTable
          features={PLAN_FEATURES}
          plans={PRICING_PLANS}
          defaultPlan={currentPlanId}
          defaultInterval={
            (subscription?.period as "monthly" | "yearly") || "monthly"
          }
          onPlanSelect={(plan, isYearly) => handlePlanSelect(plan, isYearly)}
          onBack={() => setShowPricingTable(false)}
        />
      </div>
    )
  }

  const displayLimit = usageLimit

  return (
    <div className="space-y-6">
      <BillingHeader />
      {/* Current Plan Block */}
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row md:justify-between gap-4 md:gap-0">
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium">
                  {PLAN_LIMITS[currentPlanId].displayName}
                </h3>
                <span className="bg-muted/80 text-accent-foreground px-2 py-0.5 rounded-sm text-xs border shadow-inner">
                  Current plan
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {PLAN_LIMITS[currentPlanId].description}
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-between items-end space-y-3">
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center">
                <div className="w-5 mr-2">
                  <CircleProgress progress={usageCount / displayLimit} />
                </div>
                <div className="text-sm text-foreground">
                  New UI Generations
                </div>
              </div>
              <div className="text-sm tabular-nums">
                {usageCount.toLocaleString()} / {displayLimit.toLocaleString()}
              </div>
            </div>
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center">
                <div className="w-5 mr-2 flex justify-center items-center">
                  <div className="flex items-center justify-center h-6 w-6 p-1 pb-2">
                    <span className="text-[22px] leading-none">∞</span>
                  </div>
                </div>
                <div className="text-sm text-foreground">UI Inspirations</div>
              </div>
              <span className="bg-muted/80 text-accent-foreground px-2 py-0.5 rounded-sm text-xs border shadow-inner">
                unlimited
              </span>
            </div>
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center">
                <div className="w-5 mr-2 flex justify-center items-center">
                  <div className="flex items-center justify-center h-6 w-6 p-1 pb-2">
                    <span className="text-[22px] leading-none">∞</span>
                  </div>
                </div>
                <div className="text-sm text-foreground">SVG Logo Searches</div>
              </div>
              <span className="bg-muted/80 text-accent-foreground px-2 py-0.5 rounded-sm text-xs border shadow-inner">
                unlimited
              </span>
            </div>
            {usageLimit !== PLAN_LIMITS[currentPlanId].generationsPerMonth && (
              <div className="text-xs text-muted-foreground mt-1 max-w-[200px] text-right">
                {subscription?.cancel_at_period_end
                  ? "Your higher limit will remain active until the end of the billing period"
                  : "Your limit differs from the pro plan limit due to a recent plan change"}
              </div>
            )}
          </div>
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

      {/* Upgrade Plan Block - show only if there's an upgrade option */}
      {upgradePlanId && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            Upgrade to {PLAN_LIMITS[upgradePlanId].displayName}
          </h3>

          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="p-4 grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium">
                  ${upgradePlanId === "pro" ? "20" : "40"} per month
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {PLAN_LIMITS[upgradePlanId].description}
                </p>
              </div>

              <div className="space-y-1">
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
                    (feature: string) =>
                      !PLAN_LIMITS[currentPlanId].features.includes(feature),
                  )
                  .map((feature: string, index: number) => (
                    <div key={index} className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span className="text-xs">{feature}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-muted p-3 rounded-b-lg flex justify-end border-t ">
              <Button
                disabled={isUpgradeLoading}
                onClick={() => confirmUpgrade(upgradePlanId as PlanType)}
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
          </div>
        </div>
      )}

      {/* Invoices Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Payment history</h3>
        <InvoicesList invoices={invoices} isLoading={isLoadingInvoices} />
      </div>

      {/* Stripe Portal */}
      {currentPlanId !== "free" && subscription?.portal_url && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Manage subscription</h3>
          <div className="bg-background rounded-lg border border-border p-4">
            <div className="flex justify-center">
              {subscription?.portal_url && (
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={() => window.open(subscription.portal_url, "_blank")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage subscription
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        open={confirmationDialog.open}
        onOpenChange={(open) =>
          setConfirmationDialog((prev) => ({ ...prev, open }))
        }
        title={confirmationDialog.title}
        description={confirmationDialog.description}
        onConfirm={confirmationDialog.onConfirm}
        isLoading={confirmationDialog.isLoading}
      />

      {/* Upgrade confirmation dialog */}
      <UpgradeConfirmationDialog
        open={upgradeConfirmation.open}
        onOpenChange={(open) =>
          setUpgradeConfirmation((prev) => ({ ...prev, open }))
        }
        currentPlanId={currentPlanId}
        upgradePlanId={upgradeConfirmation.planId}
        onConfirm={() => {
          setUpgradeConfirmation((prev) => ({ ...prev, open: false }))
          handleUpgradePlan(upgradeConfirmation.planId)
        }}
        isLoading={isUpgradeLoading}
      />
    </div>
  )
}

// Add static method to BillingSettingsClient component
BillingSettingsClient.AllPlansTrigger = AllPlansTrigger
