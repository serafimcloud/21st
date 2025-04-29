"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, ArrowLeft, LoaderCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  trackAttribution,
  ATTRIBUTION_SOURCE,
  SOURCE_DETAIL,
} from "@/lib/attribution-tracking"

export type PlanLevel = "free" | "pro" | "pro_plus" | string

export interface PricingFeature {
  name: string
  included: PlanLevel | null
  value?: string
  valueByPlan?: Record<PlanLevel, string>
}

export interface PricingPlan {
  name: string
  level: PlanLevel
  price: {
    monthly: number
    yearly: number
  }
  popular?: boolean
}

export interface PricingTableProps
  extends React.HTMLAttributes<HTMLDivElement> {
  features: PricingFeature[]
  plans: PricingPlan[]
  onPlanSelect?: (plan: PlanLevel, isYearly: boolean) => void
  onBack?: () => void
  defaultPlan?: PlanLevel
  defaultInterval?: "monthly" | "yearly"
  containerClassName?: string
  buttonClassName?: string
  showBackButton?: boolean
}

export function PricingTable({
  features,
  plans,
  onPlanSelect,
  onBack,
  defaultPlan = "pro",
  defaultInterval = "monthly",
  className,
  containerClassName,
  showBackButton = true,
  ...props
}: PricingTableProps) {
  const [isYearly, setIsYearly] = React.useState(defaultInterval === "yearly")
  const [selectedPlan, setSelectedPlan] = React.useState<PlanLevel>(defaultPlan)
  const [isLoading, setIsLoading] = React.useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)
  const [initialIsYearly] = React.useState(defaultInterval === "yearly")

  const handlePlanSelect = (plan: PlanLevel) => {
    trackAttribution(
      ATTRIBUTION_SOURCE.SETTINGS,
      SOURCE_DETAIL.SETTINGS_BILLING,
    )
    setSelectedPlan(plan)
  }

  const handleApplyPlan = async () => {
    trackAttribution(
      ATTRIBUTION_SOURCE.SETTINGS,
      isPlanUpgrade(selectedPlan, defaultPlan)
        ? SOURCE_DETAIL.SETTINGS_BILLING
        : SOURCE_DETAIL.SETTINGS_BILLING,
    )

    if (selectedPlan === defaultPlan && isYearly !== initialIsYearly) {
      setIsLoading(true)
      try {
        await onPlanSelect?.(selectedPlan, isYearly)
      } finally {
        setIsLoading(false)
      }
      return
    }

    setIsLoading(true)
    try {
      await onPlanSelect?.(selectedPlan, isYearly)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmDowngrade = async () => {
    trackAttribution(
      ATTRIBUTION_SOURCE.SETTINGS,
      SOURCE_DETAIL.SETTINGS_BILLING,
    )

    setIsLoading(true)
    try {
      await onPlanSelect?.(selectedPlan, isYearly)
    } finally {
      setIsLoading(false)
      setShowConfirmDialog(false)
    }
  }

  const getButtonText = () => {
    const planName = plans.find((p) => p.level === selectedPlan)?.name

    if (selectedPlan === defaultPlan && isYearly === initialIsYearly) {
      return `Current plan: ${planName}`
    } else if (isPlanUpgrade(selectedPlan, defaultPlan)) {
      return isLoading ? "Processing..." : "Upgrade"
    } else if (selectedPlan === defaultPlan && isYearly !== initialIsYearly) {
      return isLoading
        ? "Processing..."
        : isYearly
          ? "Switch to yearly billing"
          : "Switch to monthly billing"
    } else {
      return isLoading ? "Processing..." : "Downgrade"
    }
  }

  const isPlanUpgrade = (selected: PlanLevel, current: PlanLevel) => {
    const levels = ["free", "pro", "pro_plus", "all"]
    return levels.indexOf(selected) > levels.indexOf(current)
  }

  return (
    <section
      className={cn(
        "bg-background text-foreground",
        "px-1",
        "fade-bottom overflow-hidden pb-0",
        className,
      )}
    >
      <div
        className={cn("w-full max-w-3xl mx-auto", containerClassName)}
        {...props}
      >
        {showBackButton && (
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-1"
            >
              <ArrowLeft size={16} />
              Back to billing
            </Button>
          </div>
        )}

        <div className="flex justify-between items-center mb-8 min-h-8">
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={cn(
                "px-3 py-1 rounded-md transition-colors",
                !isYearly ? "bg-zinc-100 dark:bg-zinc-800" : "text-zinc-500",
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={cn(
                "px-3 py-1 rounded-md transition-colors",
                isYearly ? "bg-zinc-100 dark:bg-zinc-800" : "text-zinc-500",
              )}
            >
              Yearly
            </button>
          </div>

          {(selectedPlan !== defaultPlan || isYearly !== initialIsYearly) && (
            <Button
              onClick={handleApplyPlan}
              variant={getButtonText() === "Downgrade" ? "outline" : "default"}
              disabled={isLoading}
            >
              {isLoading && (
                <LoaderCircle className="mr-2 h-3 w-3 animate-spin" />
              )}
              {getButtonText()}
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {plans.map((plan) => (
            <button
              key={plan.name}
              type="button"
              onClick={() => handlePlanSelect(plan.level)}
              className={cn(
                "flex-1 p-4 rounded-xl text-left transition-all",
                "border border-zinc-200 dark:border-zinc-800",
                selectedPlan === plan.level &&
                  "ring-2 ring-blue-500 dark:ring-blue-400",
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{plan.name}</span>
                {plan.level === defaultPlan && isYearly === initialIsYearly && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  ${isYearly ? plan.price.yearly : plan.price.monthly}
                </span>
                <span className="text-sm font-normal text-zinc-500">
                  /{isYearly ? "year" : "month"}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto sm:overflow-x-visible">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {/* Desktop Header - hidden on mobile */}
              <div className="hidden sm:flex items-center p-4 bg-zinc-50 dark:bg-zinc-900">
                <div className="flex-1 min-w-[150px] text-sm font-medium">
                  Features
                </div>
                <div className="flex items-center gap-4 text-sm shrink-0">
                  {plans.map((plan) => (
                    <div
                      key={plan.level}
                      className="w-[100px] text-left font-medium"
                    >
                      {plan.name}
                    </div>
                  ))}
                </div>
              </div>
              {features.map((feature) => (
                <div
                  key={feature.name}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center p-4 transition-colors",
                  )}
                >
                  <div className="flex-1 min-w-[150px] text-sm font-medium mb-2 sm:mb-0">
                    {feature.name}
                  </div>
                  <div className="flex items-center gap-4 text-sm shrink-0">
                    {plans.map((plan) => (
                      <div
                        key={plan.level}
                        className={cn(
                          "w-[100px] flex items-center gap-2 justify-start",
                          plan.level === selectedPlan
                            ? "font-medium"
                            : "font-light",
                        )}
                      >
                        <span className="sm:hidden text-xs text-zinc-500">
                          {plan.name}:
                        </span>
                        {getFeatureValue(feature, plan.level, isYearly)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Downgrade</DialogTitle>
            <DialogDescription>
              Are you sure you want to downgrade your plan? You will lose access
              to premium features immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDowngrade}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="mr-2 h-3 w-3 animate-spin" />
                  Processing
                </>
              ) : (
                "Confirm Downgrade"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function getFeatureValue(
  feature: PricingFeature,
  planLevel: string,
  isYearly: boolean,
): React.ReactNode {
  if (feature.valueByPlan && feature.valueByPlan[planLevel as PlanLevel]) {
    const value = feature.valueByPlan[planLevel as PlanLevel]

    // Handle dynamic pricing for AI Generation
    if (feature.name === "AI Generation") {
      if (planLevel === "free") return "$0.32 per generation"
      if (planLevel === "pro")
        return isYearly ? "$0.32 per generation" : "$0.40 per generation"
      if (planLevel === "pro_plus")
        return isYearly ? "$0.16 per generation" : "$0.20 per generation"
    }

    // Handle dynamic pricing for Premium Component
    if (feature.name === "Premium Component") {
      if (planLevel === "free") return "Not available"
      if (planLevel === "pro")
        return isYearly ? "$0.80 per component" : "$1.00 per component"
      if (planLevel === "pro_plus")
        return isYearly ? "$0.60 per component" : "$0.75 per component"
    }

    if (value === "✓") {
      return <Check className="h-4 w-4 text-blue-500" />
    }
    if (value === "-") {
      return <span className="text-zinc-300 dark:text-zinc-700">-</span>
    }
    // Handle special values like "5/m", "50/m", etc.
    if (value?.endsWith("/m")) {
      return <span>{value}</span>
    }
    // Handle "Unlimited" value
    if (value === "Unlimited") {
      return <span className="font-medium">{value}</span>
    }
    return value
  }

  if (feature.value && shouldShowCheck(feature.included, planLevel)) {
    return feature.value
  }

  if (shouldShowCheck(feature.included, planLevel)) {
    return <Check className="h-4 w-4 text-blue-500" />
  } else {
    return <span className="text-zinc-300 dark:text-zinc-700">-</span>
  }
}

function shouldShowCheck(
  included: PricingFeature["included"],
  level: string,
): boolean {
  if (included === "all") return true
  if (included === "pro_plus" && (level === "pro_plus" || level === "all"))
    return true
  if (
    included === "pro" &&
    (level === "pro" || level === "pro_plus" || level === "all")
  )
    return true
  if (
    included === "free" &&
    (level === "free" || level === "pro" || level === "pro_plus")
  )
    return true
  return false
}
