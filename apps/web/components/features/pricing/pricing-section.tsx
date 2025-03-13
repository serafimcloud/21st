"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { PricingTabs } from "./pricing-tab"
import NumberFlow, { NumberFlowGroup } from "@number-flow/react"
import type { PlanType } from "@/lib/config/subscription-plans"
import { useAtom } from "jotai"
import { pricingFrequencyAtom } from "./pricing-tab"
import React from "react"
import { SignInButton } from "@clerk/nextjs"

interface PricingProps {
  frequencies: readonly [string, ...string[]]
  tiers: Array<{
    name: string
    type: PlanType
    price: {
      [key: string]: string | number
    }
    tokenPrice: {
      monthly: number
      yearly: number
    }
    tokens: number
    description: string
    features: string[]
    cta: string
    href: string
    popular?: boolean
    highlighted?: boolean
  }>
  currentPlan?: PlanType
  currentFrequency?: "monthly" | "yearly"
  onUpgrade: (planId: PlanType, period?: "monthly" | "yearly") => void
  onDowngrade: () => void
  isAuthenticated?: boolean
}

const planOrder = { free: 1, pro: 2, pro_plus: 3 }

function formatPriceFeature(feature: string, frequency: string): string {
  if (!feature.includes("monthly / $")) {
    return feature
  }

  try {
    const [prefix, pricesSection] = feature.split("($")
    if (!pricesSection) return feature

    const prices = pricesSection.replace(")", "")
    const [monthlyPrice, yearlyPrice] = prices.split(" / $")

    if (!monthlyPrice || !yearlyPrice) return feature

    return `${prefix}($${frequency === "yearly" ? yearlyPrice : monthlyPrice})`
  } catch {
    return feature
  }
}

export function PricingSection({
  frequencies,
  tiers,
  currentPlan,
  currentFrequency,
  onUpgrade,
  onDowngrade,
  isAuthenticated = false,
}: PricingProps) {
  const [frequency] = useAtom(pricingFrequencyAtom)

  const handleClick = (tierType: PlanType) => {
    const isDowngrade = planOrder[tierType] < planOrder[currentPlan || "free"]

    if (tierType === currentPlan && currentFrequency !== frequency) {
      onUpgrade(tierType, frequency)
    } else if (isDowngrade) {
      onDowngrade()
    } else {
      onUpgrade(tierType, frequency)
    }
  }

  const getButtonText = (tierType: PlanType) => {
    const isDowngrade = planOrder[tierType] < planOrder[currentPlan || "free"]
    const isCurrentPlan = tierType === currentPlan

    if (tierType === "free" && currentPlan === "free") {
      return "Current Plan"
    }

    if (isCurrentPlan && tierType !== "free") {
      if (currentFrequency !== frequency) {
        return frequency === "yearly"
          ? "Switch to yearly billing"
          : "Switch to monthly billing"
      }
      return "Current Plan"
    }

    return isDowngrade ? "Downgrade" : "Upgrade"
  }

  const renderUpgradeButton = (tier: PricingProps["tiers"][0]) => {
    const buttonContent = (
      <Button
        variant={currentPlan === tier.type ? "outline" : "default"}
        className={cn("w-full")}
        disabled={
          (currentPlan === tier.type && currentFrequency === frequency) ||
          (tier.type === "free" && currentPlan === "free")
        }
        onClick={() => handleClick(tier.type)}
      >
        {getButtonText(tier.type)}
      </Button>
    )

    if (!isAuthenticated && tier.type !== "free") {
      return <SignInButton mode="modal">{buttonContent}</SignInButton>
    }

    return buttonContent
  }

  const formatFeatureWithPrice = (
    feature: string,
    tier: PricingProps["tiers"][0],
  ) => {
    if (feature.includes("Premium 21st.dev Components")) {
      return "Premium 21st.dev Components"
    }
    if (feature.includes("AI Component Generation")) {
      return "AI Component Generation"
    }
    if (feature.includes("tokens per month")) {
      return `${tier.tokens} tokens included ($${tier.tokenPrice[frequency].toFixed(2)}/token)`
    }
    return feature
  }

  return (
    <div className="py-24">
      <div className="mx-auto">
        <div className="mx-auto max-w-4xl text-center mb-8">
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl mb-3">
            Build UIs
            <br />
            at the speed of thought.
          </h1>
          <p className="text-lg leading-8 text-muted-foreground font-light max-w-xl mx-auto">
            Create beautiful UI with Magic MCP and access premium components
            from top developers. Cancel anytime.
          </p>
        </div>

        <div className="mt-10 flex justify-center items-center">
          <PricingTabs options={frequencies} discountOption="yearly" />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
          <NumberFlowGroup>
            {tiers.map((tier) => {
              const priceValue =
                typeof tier.price[frequency] === "number"
                  ? frequency === "yearly"
                    ? (tier.price[frequency] as number) / 12
                    : (tier.price[frequency] as number)
                  : (frequency === "yearly"
                      ? parseFloat(tier.price[frequency] as string) / 12
                      : parseFloat(tier.price[frequency] as string)) || 0

              return (
                <div
                  key={tier.name}
                  className={cn(
                    "bg-card rounded-2xl shadow-sm overflow-hidden",
                    tier.highlighted ? "bg-muted" : "bg-card border",
                  )}
                >
                  <div className="p-8">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        {tier.name}
                      </h3>
                      {tier.popular && (
                        <span className="inline-block text-xs font-medium bg-blue-100 text-blue-600 px-2 py-1 rounded-md">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tier.description}
                    </p>
                    <div className="mt-4">
                      <div className="flex items-baseline">
                        <span className="text-5xl font-bold">
                          <NumberFlow
                            format={{
                              style: "currency",
                              currency: "USD",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }}
                            value={priceValue}
                          />
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground block">
                        per month {frequency === "yearly" && "billed yearly"}
                      </span>
                    </div>

                    <div className="block mt-6">
                      {renderUpgradeButton(tier)}
                    </div>
                  </div>

                  <div className="px-8 pb-8">
                    <ul className="space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start">
                          <Check className="h-5 w-5 flex-shrink-0 text-foreground mt-0.5" />
                          <span className="ml-3 text-sm text-muted-foreground">
                            {formatFeatureWithPrice(feature, tier)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </NumberFlowGroup>
        </div>
      </div>
    </div>
  )
}
