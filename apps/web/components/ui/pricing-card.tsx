"use client"

import * as React from "react"
import { Check } from "lucide-react"
import NumberFlow from "@number-flow/react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PricingCardPlan } from "@/lib/config/subscription-plans"

export interface PricingTier {
  name: string
  price: Record<string, number | string>
  description: string
  features: string[]
  cta: string
  href?: string
  highlighted?: boolean
  popular?: boolean
}

interface PricingCardProps {
  tier?: PricingTier
  paymentFrequency?: string
  plan?: PricingCardPlan
  isYearly?: boolean
  isLoading?: boolean
  onClick?: () => void
  isFeatured?: boolean
  isActive?: boolean
}

export function PricingCard({
  tier,
  paymentFrequency = "monthly",
  plan,
  isYearly = false,
  isLoading = false,
  onClick,
  isFeatured,
  isActive,
}: PricingCardProps) {
  const usingTier = !!tier

  const name = usingTier ? tier.name : plan?.name || ""
  const description = usingTier ? tier.description : plan?.description || ""
  const features = usingTier ? tier.features : plan?.features || []
  const buttonText = usingTier ? tier.cta : plan?.buttonText || "Get Started"
  const isPlanFeatured = usingTier
    ? tier.popular
    : isFeatured || plan?.isFeatured
  const href = usingTier ? tier.href : undefined

  let price: number | string = 0
  let pricePeriod = "/month"

  if (usingTier && tier) {
    price = tier.price[paymentFrequency] || 0
    pricePeriod = paymentFrequency === "yearly" ? "/year" : "/month"
  } else if (plan) {
    if (isYearly && plan.yearlyPrice !== undefined) {
      price = plan.yearlyPrice
      pricePeriod = "/year"
    } else if (plan.monthlyPrice !== undefined) {
      price = plan.monthlyPrice
      pricePeriod = "/month"
    }
  }

  const monthlyPrice =
    typeof price === "number" && pricePeriod === "/year"
      ? Math.round(price / 12)
      : null

  return (
    <Card
      className={cn(
        "relative flex flex-col overflow-hidden p-8 border-white/10 bg-white/5 min-h-[33rem]",
        isPlanFeatured && "ring-2 ring-accent/50",
        isActive && "ring-2 ring-primary/50",
      )}
    >
      <motion.div layout className="flex-1 space-y-8">
        <motion.div layout className="text-center">
          <motion.h3 layout className="text-lg font-semibold text-neutral-200">
            {name}
          </motion.h3>
          <motion.div
            layout
            className="mt-2 min-h-[54px] flex items-center justify-center "
          >
            {typeof price === "number" ? (
              <div className="flex items-end justify-end">
                <motion.span
                  layout
                  className="text-4xl font-bold text-neutral-200"
                >
                  <NumberFlow
                    format={{
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }}
                    value={price}
                  />
                </motion.span>
                <motion.span layout className="text-neutral-400 mb-2">
                  {pricePeriod}
                </motion.span>
              </div>
            ) : (
              <motion.span
                layout
                className="text-4xl font-bold text-neutral-200"
              >
                ${price}
              </motion.span>
            )}
          </motion.div>
          {monthlyPrice && (
            <motion.p
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-1 text-sm text-neutral-400"
            >
              ${monthlyPrice}/month billed yearly
            </motion.p>
          )}
          <motion.p layout className="mt-2 text-sm text-neutral-400">
            {description}
          </motion.p>
        </motion.div>

        <motion.ul layout className="space-y-4">
          {features.map((feature, featureIndex) => (
            <motion.li
              layout
              key={featureIndex}
              className="flex items-start gap-x-2 "
            >
              <Check className="h-5 w-5 min-w-5 min-h-5 text-neutral-200 mt-1" />
              <span className="text-neutral-400">{feature}</span>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>

      <motion.div layout className="mt-8">
        <Button
          variant="default"
          size="lg"
          className={cn(
            "w-full bg-neutral-200 text-black hover:bg-white/90",
            isActive &&
              "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
          onClick={onClick}
          disabled={isLoading}
          asChild={!!href}
        >
          {href ? (
            <a href={href}>{isLoading ? "Loading..." : buttonText}</a>
          ) : isLoading ? (
            "Loading..."
          ) : (
            buttonText
          )}
        </Button>
      </motion.div>
    </Card>
  )
}
