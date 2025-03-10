"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAtom } from "jotai"
import { pricingFrequencyAtom } from "./pricing-tab"

export type PlanType = "free" | "pro" | "team" | string

export interface ComparisonFeature {
  name: string
  section?: string
  values: Record<PlanType, React.ReactNode>
}

export interface Plan {
  name: string
  type: PlanType
  price: {
    monthly: number | string
    yearly: number | string
  }
  popular?: boolean
  buttonText: string
  buttonAction?: () => void
  buttonHref?: string
  disabled?: boolean
}

export interface PlanComparisonTableProps
  extends React.HTMLAttributes<HTMLDivElement> {
  features: ComparisonFeature[]
  plans: Plan[]
  className?: string
  currentPlan?: PlanType
  onPlanSelect?: (plan: PlanType, isYearly: boolean) => void
}

export function PlanComparisonTable({
  features,
  plans,
  className,
  currentPlan = "free",
  onPlanSelect,
  ...props
}: PlanComparisonTableProps) {
  const [frequency] = useAtom(pricingFrequencyAtom)
  const isYearly = frequency === "yearly"

  // Group features by section
  const featureSections = features.reduce<Record<string, ComparisonFeature[]>>(
    (acc, feature) => {
      const section = feature.section || "Features"
      if (!acc[section]) {
        acc[section] = []
      }
      acc[section].push(feature)
      return acc
    },
    {},
  )

  const sectionNames = Object.keys(featureSections)

  // Function to render the feature value
  const renderFeatureValue = (value: React.ReactNode) => {
    if (value === "check") {
      return <CheckValue />
    }
    return value
  }

  return (
    <div className={cn("w-full", className)} {...props}>
      {/* Header row with plan names and pricing */}
      <div className="grid grid-cols-4 mb-8 gap-8 items-baseline">
        <div className="col-span-1 pt-10">
          <h2 className="text-2xl font-bold tracking-tight">
            Compare plans &amp; features
          </h2>
        </div>

        {plans.map((plan) => {
          const rawPrice = isYearly ? plan.price.yearly : plan.price.monthly
          const price = isYearly
            ? typeof rawPrice === "number"
              ? (rawPrice / 12).toFixed(0)
              : (parseFloat(rawPrice as string) / 12).toFixed(0)
            : rawPrice
          const period = isYearly
            ? {
                primary: "per month",
                secondary: "billed yearly",
              }
            : plan.type === "team"
              ? "per member/mo"
              : "per mo"
          const isCurrentPlan = currentPlan === plan.type
          const planIndex = plans.findIndex((p) => p.type === plan.type)
          const currentPlanIndex = plans.findIndex(
            (p) => p.type === currentPlan,
          )
          const isDowngrade = planIndex < currentPlanIndex

          return (
            <div key={plan.type} className="col-span-1 flex flex-col">
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                {plan.popular && (
                  <span className="inline-block text-xs font-medium bg-blue-100 text-blue-600 px-2 py-1 rounded-md">
                    Popular
                  </span>
                )}
              </div>

              <div className="mb-6 flex gap-2 items-end">
                <div className="flex">
                  <span className="text-4xl font-bold">
                    {typeof price === "number" ? `$${price}` : `$${price}`}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {typeof period === "string" ? (
                    period
                  ) : (
                    <>
                      <div>{period.primary}</div>
                      <div>{period.secondary}</div>
                    </>
                  )}
                </div>
              </div>

              <Button
                variant={plan.type === "pro" ? "default" : "outline"}
                className={cn(
                  "justify-center",
                  plan.type === "pro" &&
                    "bg-black text-white hover:bg-black/90",
                  isCurrentPlan &&
                    "border-primary text-primary hover:bg-primary/5",
                )}
                onClick={() => onPlanSelect?.(plan.type, isYearly)}
                disabled={isCurrentPlan || plan.disabled}
              >
                {isCurrentPlan
                  ? `On ${plan.name} plan`
                  : isDowngrade
                    ? "Downgrade"
                    : plan.buttonText}
              </Button>
            </div>
          )
        })}
      </div>
      {/* Feature sections */}
      {sectionNames.map((sectionName) => (
        <div key={sectionName} className="mb-12">
          <h3 className="text-xl font-semibold mb-4">{sectionName}</h3>

          <div className="bg-background border rounded-lg overflow-hidden">
            {featureSections[sectionName]?.map((feature, idx) => (
              <div
                key={feature.name}
                className={cn(
                  "grid grid-cols-4 py-4 gap-8",
                  idx !== (featureSections[sectionName]?.length ?? 0) - 1 &&
                    "border-b",
                )}
              >
                <div className="col-span-1 flex items-center">
                  <span className="text-sm font-medium pl-6">
                    {feature.name}
                  </span>
                </div>

                {plans.map((plan) => (
                  <div
                    key={`${feature.name}-${plan.type}`}
                    className="col-span-1 flex items-center justify-P"
                  >
                    {renderFeatureValue(feature.values[plan.type])}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Helper function to render feature value check mark
export function CheckValue() {
  return <Check className="h-5 w-5 text-green-500" />
}
