"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import Link from "next/link"
import { PricingTabs } from "./pricing-tab"
import NumberFlow, { NumberFlowGroup } from "@number-flow/react"
import type { PlanType } from "@/lib/config/subscription-plans"
import { useAtom } from "jotai"
import { pricingFrequencyAtom } from "./pricing-tab"
import React from "react"

interface PricingProps {
  frequencies: readonly [string, ...string[]]
  tiers: Array<{
    name: string
    type: PlanType
    price: {
      [key: string]: string | number
    }
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
}

const planOrder = { free: 1, pro: 2, pro_plus: 3 }

export function PricingSection({
  frequencies,
  tiers,
  currentPlan,
  currentFrequency,
  onUpgrade,
  onDowngrade,
}: PricingProps) {
  const [frequency] = useAtom(pricingFrequencyAtom)

  const handleClick = (tierType: PlanType) => {
    const isDowngrade = planOrder[tierType] < planOrder[currentPlan || "free"]

    console.log("🔥 CURRENT SUBSCRIPTION:", {
      "Current Plan": currentPlan,
      "Current Billing": currentFrequency,
      "Selected Billing": frequency,
    })

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

    if (isCurrentPlan && currentFrequency !== frequency) {
      return frequency === "yearly"
        ? "Switch to yearly billing"
        : "Switch to monthly billing"
    }
    if (isCurrentPlan) return "Current Plan"
    return isDowngrade ? "Downgrade" : "Upgrade"
  }

  return (
    <div className="py-24">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
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

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
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
                    <div className="">
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

                    <Link
                      href={
                        currentPlan === tier.type &&
                        currentFrequency === frequency
                          ? "#"
                          : tier.href
                      }
                      className="block mt-6"
                      onClick={(e) => {
                        if (
                          currentPlan === tier.type &&
                          currentFrequency === frequency
                        ) {
                          e.preventDefault()
                        }
                      }}
                    >
                      <Button
                        variant={
                          currentPlan === tier.type ? "outline" : "default"
                        }
                        className={cn("w-full")}
                        disabled={
                          currentPlan === tier.type &&
                          currentFrequency === frequency
                        }
                        onClick={() => handleClick(tier.type)}
                      >
                        {getButtonText(tier.type)}
                      </Button>
                    </Link>
                  </div>

                  <div className="px-8 pb-8">
                    <ul className="space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start">
                          <Check className="h-5 w-5 flex-shrink-0 text-foreground mt-0.5" />
                          <span className="ml-3 text-sm text-muted-foreground">
                            {feature}
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
