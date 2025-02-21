"use client"

import * as React from "react"
import { Check, Star } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const pricingCardVariants = cva(
  "relative overflow-hidden rounded-xl border bg-background transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-border",
        featured: "border-primary border-2",
      },
      size: {
        default: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

interface PricingPlan {
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  buttonText: string
  href: string
  isFeatured?: boolean
}

interface PricingCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pricingCardVariants> {
  plan: PricingPlan
  isYearly?: boolean
  onClick?: () => void
}

export function PricingCard({
  className,
  plan,
  variant,
  size,
  isYearly = false,
  onClick,
  ...props
}: PricingCardProps) {
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice

  return (
    <div
      className={cn(
        pricingCardVariants({
          variant: plan.isFeatured ? "featured" : "default",
          size,
          className,
        }),
      )}
      {...props}
    >
      {plan.isFeatured && (
        <div className="absolute right-0 top-0 bg-primary py-0.5 px-3 rounded-bl-xl rounded-tr-xl flex items-center">
          <Star className="text-primary-foreground h-4 w-4 fill-current" />
          <span className="text-primary-foreground ml-1 text-sm font-medium">
            Popular
          </span>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-xl">{plan.name}</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            {plan.description}
          </p>
        </div>

        <div className="flex items-baseline">
          <span className="text-3xl font-bold">$</span>
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-muted-foreground ml-2">
            /{isYearly ? "year" : "month"}
          </span>
        </div>

        <div className="space-y-2">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>

        <Button
          className={cn(
            "w-full",
            plan.isFeatured
              ? "bg-primary hover:bg-primary/90"
              : "bg-primary hover:bg-primary/90",
          )}
          onClick={onClick}
        >
          {plan.buttonText}
        </Button>
      </div>
    </div>
  )
}
