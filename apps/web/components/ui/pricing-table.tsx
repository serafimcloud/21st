"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, ArrowRight, ArrowLeft } from "lucide-react"

export type PlanLevel = "free" | "standard" | "pro" | "all" | string

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
  onPlanSelect?: (plan: PlanLevel) => void
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
  defaultPlan = "standard",
  defaultInterval = "monthly",
  className,
  containerClassName,
  buttonClassName,
  showBackButton = true,
  ...props
}: PricingTableProps) {
  const [isYearly, setIsYearly] = React.useState(defaultInterval === "yearly")
  const [selectedPlan, setSelectedPlan] = React.useState<PlanLevel>(defaultPlan)

  const handlePlanSelect = (plan: PlanLevel) => {
    setSelectedPlan(plan)
    onPlanSelect?.(plan)
  }

  const getButtonText = () => {
    const planName = plans.find((p) => p.level === selectedPlan)?.name

    if (selectedPlan === defaultPlan) {
      return `Current plan: ${planName}`
    } else if (isPlanUpgrade(selectedPlan, defaultPlan)) {
      return `Upgrade to ${planName}`
    } else {
      return `Downgrade to ${planName}`
    }
  }

  const isPlanUpgrade = (selected: PlanLevel, current: PlanLevel) => {
    const levels = ["free", "standard", "pro", "all"]
    return levels.indexOf(selected) > levels.indexOf(current)
  }

  return (
    <section
      className={cn(
        "bg-background text-foreground",
        "py-6 px-4",
        "fade-bottom overflow-hidden pb-0",
        className,
      )}
    >
      <div
        className={cn("w-full max-w-3xl mx-auto", containerClassName)}
        {...props}
      >
        <div className="flex justify-between items-center mb-4 sm:mb-8">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-1"
            >
              <ArrowLeft size={16} />
              Back to billing
            </Button>
          )}

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
                {plan.popular && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">
                    Popular
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
          <div className="overflow-x-auto">
            <div className="min-w-[640px] divide-y divide-zinc-200 dark:divide-zinc-800">
              <div className="flex items-center p-4 bg-zinc-50 dark:bg-zinc-900">
                <div className="flex-1 text-sm font-medium">Features</div>
                <div className="flex items-center gap-8 text-sm">
                  {plans.map((plan) => (
                    <div
                      key={plan.level}
                      className="w-16 text-center font-medium"
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
                    "flex items-center p-4 transition-colors",
                    feature.included === selectedPlan &&
                      "bg-blue-50/50 dark:bg-blue-900/20",
                  )}
                >
                  <div className="flex-1 text-sm">{feature.name}</div>
                  <div className="flex items-center gap-8 text-sm">
                    {plans.map((plan) => (
                      <div
                        key={plan.level}
                        className={cn(
                          "w-16 flex justify-center",
                          plan.level === selectedPlan && "font-medium",
                        )}
                      >
                        {getFeatureValue(feature, plan.level)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button
            className={cn(
              "w-full sm:w-auto px-8 py-2 rounded-xl",
              buttonClassName,
            )}
            onClick={() => onPlanSelect?.(selectedPlan)}
            disabled={selectedPlan === defaultPlan}
          >
            {getButtonText()}
            {selectedPlan !== defaultPlan && (
              <ArrowRight className="w-4 h-4 ml-2" />
            )}
          </Button>
        </div>
      </div>
    </section>
  )
}

function getFeatureValue(
  feature: PricingFeature,
  planLevel: string,
): React.ReactNode {
  if (feature.valueByPlan && feature.valueByPlan[planLevel as PlanLevel]) {
    return feature.valueByPlan[planLevel as PlanLevel]
  }

  if (feature.value && shouldShowCheck(feature.included, planLevel)) {
    return feature.value
  }

  if (shouldShowCheck(feature.included, planLevel)) {
    return <span className="text-blue-500">✓</span>
  } else {
    return <span className="text-zinc-300 dark:text-zinc-700">-</span>
  }
}

function shouldShowCheck(
  included: PricingFeature["included"],
  level: string,
): boolean {
  if (included === "all") return true
  if (included === "pro" && (level === "pro" || level === "all")) return true
  if (
    included === "standard" &&
    (level === "standard" || level === "pro" || level === "all")
  )
    return true
  if (
    included === "free" &&
    (level === "free" ||
      level === "standard" ||
      level === "pro" ||
      level === "all")
  )
    return true
  return false
}
