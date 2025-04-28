"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAtom } from "jotai"
import { pricingFrequencyAtom } from "./pricing-tab"
import { PlanType } from "@/lib/config/subscription-plans"
import { SignInButton } from "@clerk/nextjs"

export interface ComparisonFeature {
  name: string
  section?: string
  values: Record<
    PlanType,
    | string
    | {
        monthly: string
        yearly: string
      }
  >
}

export interface Plan {
  name: string
  type: PlanType
  price: {
    monthly: number | string
    yearly: number | string
  }
  tokenPrice: {
    monthly: number
    yearly: number
  }
  tokens: number
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
  currentFrequency?: "monthly" | "yearly"
  onUpgrade: (planId: PlanType, period?: "monthly" | "yearly") => void
  onDowngrade: () => void
  isAuthenticated?: boolean
}

const planOrder: Record<PlanType, number> = {
  free: 1,
  pro: 2,
  pro_plus: 3,
}

const getButtonText = (
  tierType: PlanType,
  currentPlan: PlanType,
  currentFrequency: "monthly" | "yearly",
  frequency: "monthly" | "yearly",
) => {
  const isDowngrade =
    (planOrder[tierType] ?? 0) < (planOrder[currentPlan || "free"] ?? 0)
  const isCurrentPlan = tierType === currentPlan

  // Always show "Current Plan" for free plan regardless of frequency
  if (tierType === "free" && currentPlan === "free") {
    return "Current Plan"
  }

  if (isCurrentPlan && currentFrequency !== frequency) {
    return frequency === "yearly"
      ? "Switch to yearly billing"
      : "Switch to monthly billing"
  }
  if (isCurrentPlan) return "Current Plan"
  return isDowngrade ? "Downgrade" : "Upgrade"
}

const handlePlanSelect = (
  planType: PlanType,
  currentPlan: PlanType,
  currentFrequency: "monthly" | "yearly",
  frequency: "monthly" | "yearly",
  onUpgrade: (planId: PlanType, period?: "monthly" | "yearly") => void,
  onDowngrade: () => void,
) => {
  const isDowngrade =
    (planOrder[planType] ?? 0) < (planOrder[currentPlan || "free"] ?? 0)

  if (planType === currentPlan && currentFrequency !== frequency) {
    onUpgrade(planType, frequency)
  } else if (isDowngrade) {
    onDowngrade()
  } else {
    onUpgrade(planType, frequency)
  }
}

// Add helper function at the top of the file
function formatPriceFeature(feature: string, frequency: string): string {
  if (!feature.includes("monthly / $")) {
    return feature
  }

  try {
    const [prefix, pricesSection] = feature.split("($")
    if (!pricesSection) return feature

    const prices = pricesSection.replace(")", "")
    const [monthlyPrice, restOfPrice] = prices.split(" / $")
    if (!monthlyPrice || !restOfPrice) return feature

    const [yearlyPrice, suffix] = restOfPrice.split(" per ")
    if (!suffix) return feature

    return `${prefix}($${frequency === "yearly" ? yearlyPrice : monthlyPrice} per ${suffix})`
  } catch {
    return feature
  }
}

export function PlanComparisonTable({
  features,
  plans,
  className,
  currentPlan = "free",
  currentFrequency = "monthly",
  onUpgrade,
  onDowngrade,
  isAuthenticated = false,
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
  const renderFeatureValue = (
    value: string | { monthly: string; yearly: string },
    planType: PlanType,
    featureName: string,
  ) => {
    if (value === "check") {
      return <CheckValue />
    }

    // Show appropriate values for Premium Components and AI Generation in free plan
    if (planType === "free") {
      if (featureName === "Premium Components") {
        return "-"
      }
      if (featureName === "AI Component Generation") {
        return "5 free generation"
      }
    }

    if (typeof value === "string") {
      return value
    }

    if (
      value &&
      typeof value === "object" &&
      "monthly" in value &&
      "yearly" in value
    ) {
      return value[frequency]
    }

    return value
  }

  const renderUpgradeButton = (plan: Plan) => {
    const buttonText = getButtonText(
      plan.type,
      currentPlan,
      currentFrequency,
      frequency,
    )

    const buttonContent = (
      <Button
        variant={plan.type === "pro_plus" ? "default" : "outline"}
        className={cn(
          "justify-center",
          plan.type === "pro_plus" && "bg-black text-white hover:bg-black/90",
        )}
        onClick={() =>
          handlePlanSelect(
            plan.type,
            currentPlan,
            currentFrequency,
            frequency,
            onUpgrade,
            onDowngrade,
          )
        }
        disabled={buttonText === "Current Plan"}
      >
        {buttonText}
      </Button>
    )

    if (!isAuthenticated && plan.type !== "free") {
      return <SignInButton mode="modal">{buttonContent}</SignInButton>
    }

    return buttonContent
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
            : "per mo"

          const tokenPriceFormatted = plan.tokenPrice[frequency].toFixed(2)

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

              <div className="mb-6 flex flex-col gap-2">
                <div className="flex gap-2 items-end">
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
                {plan.tokens && (
                  <div className="text-sm text-muted-foreground">
                    {plan.type === "free"
                      ? `${plan.tokens} tokens included`
                      : `${plan.tokens} tokens included ($${tokenPriceFormatted}/token)`}
                  </div>
                )}
              </div>

              {renderUpgradeButton(plan)}
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
                    {renderFeatureValue(
                      feature.values[plan.type],
                      plan.type,
                      feature.name,
                    )}
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
