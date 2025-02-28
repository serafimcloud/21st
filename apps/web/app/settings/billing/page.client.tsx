"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
  LoaderCircle,
  ExternalLink,
  ArrowRight,
  Check,
  Download,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  PLAN_LIMITS,
  PlanType,
  PLAN_FEATURES,
  PRICING_PLANS,
} from "@/lib/config/subscription-plans"
import { PricingTable, PlanLevel } from "@/components/ui/pricing-table"
import { BillingHeader } from "@/components/features/settings/billing/billing-header"
import { createClient } from "@supabase/supabase-js"

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

interface PlanInfo {
  id?: string
  name: string
  type: "free" | "standard" | "pro"
  period?: string | null
  periodEnd?: string | null
  usage_count?: number
  current_period_end?: string
  cancel_at_period_end?: boolean
  portal_url?: string
  stripe_subscription_id?: string
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

function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isLoading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  isLoading: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoaderCircle className="mr-2 h-3 w-3 animate-spin" />
                Processing
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function BillingSettingsClient({
  subscription,
  successParam = false,
  canceledParam = false,
}: BillingSettingsClientProps) {
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
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  })
  const [upgradeConfirmation, setUpgradeConfirmation] = useState<{
    open: boolean
    planId: PlanType
  }>({
    open: false,
    planId: "standard",
  })
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)
  const [isUsageLoading, setIsUsageLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

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
      const timer = setTimeout(() => {
        window.location.reload()
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

      // Refresh to get the current plan status
      window.location.reload()
    }
  }, [successParam, canceledParam])

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
    setIsLoading(true)
    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to cancel subscription")
      }

      setIsLoading(false)
      toast.success("Subscription successfully canceled")
      setConfirmationDialog((prev) => ({ ...prev, open: false }))

      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to cancel subscription. Please try again later.",
      )
      setIsLoading(false)
    }
  }

  const handleUpgradePlan = async (
    planId: PlanType,
    period: "monthly" | "yearly" = "monthly",
  ) => {
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
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create checkout session")
      }

      const data = await response.json()

      if (data.directly_upgraded) {
        toast.success("Subscription successfully upgraded", {
          description: "Your subscription has been upgraded to the new plan",
          duration: 5000,
        })

        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        window.location.href = data.url
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to initiate upgrade process. Please try again later.",
      )
    } finally {
      setIsUpgradeLoading(false)
    }
  }

  const confirmUpgrade = (planId: PlanType) => {
    setUpgradeConfirmation({
      open: true,
      planId,
    })
  }

  const fetchUsageData = useCallback(async () => {
    if (!userId) return

    setIsUsageLoading(true)
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_KEY || "",
      )
      const { data, error } = await supabase
        .from("usages")
        .select("usage, limit")
        .eq("user_id", userId)
        .single()

    } catch (error) {
      // Error handling
    } finally {
      setIsUsageLoading(false)
    }
  }, [userId, subscription])

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

  const handlePlanSelect = async (plan: PlanLevel, isYearly = false) => {
    const selectedPlanId = plan as PlanType

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

    if (selectedPlanId === "free" && currentPlanId !== "free") {
      // Show confirmation dialog for downgrade to free plan
      setConfirmationDialog({
        open: true,
        title: "Confirm Downgrade",
        description:
          "Are you sure you want to downgrade to the Free plan? You will lose access to premium features immediately.",
        onConfirm: () => handleCancelSubscription(),
      })
    } else if (selectedPlanId !== "free") {
      // Upgrade to paid plan
      await handleUpgradePlan(selectedPlanId, isYearly ? "yearly" : "monthly")
    }

    setShowPricingTable(false)
  }

  // Determine which plan to show as upgrade
  let upgradePlanId: PlanType | null = null
  if (currentPlanId === "free") {
    upgradePlanId = "standard"
  } else if (currentPlanId === "standard") {
    upgradePlanId = "pro"
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

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount)
  }

  // Get invoice status text
  const getInvoiceStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Paid"
      case "open":
        return "Pending"
      case "void":
        return "Voided"
      case "draft":
        return "Draft"
      case "uncollectible":
        return "Uncollectible"
      default:
        return status
    }
  }

  // Get invoice status color
  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-700 bg-green-100 border border-green-200 shadow-inner"
      case "open":
        return "text-yellow-700 bg-yellow-100 border border-yellow-200 shadow-inner"
      case "void":
      case "uncollectible":
        return "text-red-700 bg-red-100 border border-red-200 shadow-inner"
      case "draft":
        return "text-gray-700 bg-gray-100 border border-gray-200 shadow-inner"
      default:
        return "text-gray-700 bg-gray-100 border border-gray-200 shadow-inner"
    }
  }

  return (
    <div className="space-y-6">
      <BillingHeader />
      {/* Current Plan Block */}
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="p-4 flex justify-between">
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
          <div className="flex flex-col justify-between items-end">
            <div className="text-xs text-muted-foreground">Monthly limit</div>
            <div className="flex items-center gap-2">
              <svg height="22" width="22">
                <circle
                  className="text-border"
                  cx="11"
                  cy="11"
                  fill="transparent"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <circle
                  className="text-primary"
                  cx="11"
                  cy="11"
                  fill="transparent"
                  r="8"
                  stroke="currentColor"
                  strokeDasharray={`${2 * Math.PI * 8}`}
                  strokeLinecap="round"
                  strokeWidth="3"
                  strokeDashoffset={`${2 * Math.PI * 8 * (1 - usageCount / PLAN_LIMITS[currentPlanId].generationsPerMonth)}`}
                />
              </svg>
              <div className="text-sm">
                {usageCount.toLocaleString()} /{" "}
                {PLAN_LIMITS[
                  currentPlanId
                ].generationsPerMonth.toLocaleString()}
              </div>
            </div>
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
                  ${upgradePlanId === "standard" ? "10" : "30"} per month
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
        <div className="bg-background rounded-lg border border-border overflow-hidden">
          {isLoadingInvoices ? (
            <div className="min-h-24 flex items-center justify-center p-6">
              <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="min-h-24 flex items-center justify-center p-6">
              <p className="text-xs text-muted-foreground">No invoices yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-normal">№</th>
                    <th className="px-4 py-2 font-normal">Date</th>
                    <th className="px-4 py-2 font-normal">Amount</th>
                    <th className="px-4 py-2 font-normal">Period</th>
                    <th className="px-4 py-2 font-normal">Status</th>
                    <th className="px-4 py-2 font-normal"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="text-xs">
                      <td className="px-4 py-2">{invoice.number}</td>
                      <td className="px-4 py-2">
                        {formatDate(invoice.created)}
                      </td>
                      <td className="px-4 py-2">
                        {formatCurrency(invoice.amount_paid, invoice.currency)}
                      </td>
                      <td className="px-4 py-2">
                        {formatDate(invoice.period_start)} -{" "}
                        {formatDate(invoice.period_end)}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded-full ${getInvoiceStatusColor(invoice.status)}`}
                        >
                          {getInvoiceStatusText(invoice.status)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {invoice.invoice_pdf && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(
                                invoice.invoice_pdf as string,
                                "_blank",
                              )
                            }
                            className="h-8 w-8 p-0"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download PDF</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
        isLoading={isLoading}
      />

      {/* Upgrade confirmation dialog */}
      <Dialog
        open={upgradeConfirmation.open}
        onOpenChange={(open) =>
          setUpgradeConfirmation((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Plan Upgrade</DialogTitle>
            <DialogDescription>
              {currentPlanId === "free" ? (
                <>
                  You're about to upgrade to the{" "}
                  {PLAN_LIMITS[upgradeConfirmation.planId].displayName} plan.
                  You will be charged $
                  {upgradeConfirmation.planId === "standard" ? "10" : "30"} for
                  the first month.
                </>
              ) : (
                <>
                  You're about to upgrade from{" "}
                  {PLAN_LIMITS[currentPlanId].displayName} to{" "}
                  {PLAN_LIMITS[upgradeConfirmation.planId].displayName}. This
                  will update your existing subscription and you'll be charged
                  the price difference for the current billing period.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setUpgradeConfirmation((prev) => ({ ...prev, open: false }))
              }
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setUpgradeConfirmation((prev) => ({ ...prev, open: false }))
                handleUpgradePlan(upgradeConfirmation.planId)
              }}
              disabled={isUpgradeLoading}
            >
              {isUpgradeLoading ? (
                <>
                  <LoaderCircle className="mr-2 h-3 w-3 animate-spin" />
                  Processing
                </>
              ) : (
                "Confirm Upgrade"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Add static method to BillingSettingsClient component
BillingSettingsClient.AllPlansTrigger = AllPlansTrigger
