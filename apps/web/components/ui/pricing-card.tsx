"use client"

import * as React from "react"
import { Check } from "lucide-react"
import NumberFlow from "@number-flow/react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export interface PricingTier {
  name: string
  price: Record<string, number | string>
  description: string
  features: string[]
  cta: string
  highlighted?: boolean
  popular?: boolean
}

interface PricingCardProps {
  tier: PricingTier
  paymentFrequency: string
}

export function PricingCard({ tier, paymentFrequency }: PricingCardProps) {
  const price = tier.price[paymentFrequency]
  const isPopular = tier.popular

  return (
    <Card
      className={cn(
        "relative flex flex-col overflow-hidden p-8 border-white/10 bg-white/5 min-h-[30rem]",
        isPopular && "ring-2 ring-accent/50",
      )}
    >
      <motion.div layout className="flex-1 space-y-8">
        <motion.div layout className="text-center">
          <motion.h3 layout className="text-lg font-semibold text-white">
            {tier.name}
          </motion.h3>
          <motion.div
            layout
            className="mt-2 min-h-[54px] flex items-center justify-center "
          >
            {typeof price === "number" ? (
              <div className="flex items-end justify-end">
                <motion.span layout className="text-4xl font-bold text-white">
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
                <motion.span layout className="text-white/60 mb-2">
                  {paymentFrequency === "yearly" ? "/year" : "/month"}
                </motion.span>
              </div>
            ) : (
              <motion.span layout className="text-4xl font-bold text-white">
                ${price}
              </motion.span>
            )}
          </motion.div>
          {paymentFrequency === "yearly" && typeof price === "number" && (
            <motion.p
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-1 text-sm text-white/40"
            >
              ${Math.round(price / 12)}/month billed yearly
            </motion.p>
          )}
          <motion.p layout className="mt-2 text-sm text-white/60">
            {tier.description}
          </motion.p>
        </motion.div>

        <motion.ul layout className="space-y-4">
          {tier.features.map((feature, featureIndex) => (
            <motion.li
              layout
              key={featureIndex}
              className="flex items-start gap-x-2 "
            >
              <Check className="h-5 w-5 min-w-5 min-h-5 text-white mt-1" />
              <span className="text-white/60">{feature}</span>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>

      <motion.div layout className="mt-8">
        <Button
          variant="default"
          size="lg"
          className="w-full bg-white text-black hover:bg-white/90"
          onClick={() => {
            const element = document.getElementById("waitlist-form")
            if (element) {
              element.scrollIntoView({ behavior: "smooth" })
            }
          }}
        >
          {tier.cta}
        </Button>
      </motion.div>
    </Card>
  )
}
