/**
 * Subscription plans configuration
 * This file contains all information about subscription plans, including limits, features, and pricing
 */

import { PlanType, PlanPrice, PlanFeature, PricingPlan } from "@/types/global"
import { ReactNode } from "react"

export type { PlanType }

// Plan limits and basic information
export interface PlanLimits {
  generationsPerMonth: number
  displayName: string
  name: string
  description: string
  features: string[]
  monthlyPrice?: number
  yearlyPrice?: number
  tokenPricing: {
    pricePerToken: {
      monthly: number
      yearly: number
    }
    componentCost: number
    generationCost: number
  }
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    generationsPerMonth: 5,
    displayName: "Free",
    name: "Free",
    description: "Perfect for trying out",
    features: [
      "5 free tokens per month",
      "AI Component Generation",
      "Unlimited UI Inspirations",
      "Unlimited SVG Logo Search",
      "Community support",
    ],
    tokenPricing: {
      pricePerToken: {
        monthly: 0,
        yearly: 0,
      },
      componentCost: 5,
      generationCost: 1,
    },
  },
  pro: {
    generationsPerMonth: 50,
    displayName: "Pro",
    name: "Pro",
    description: "For professional developers",
    features: [
      "50 tokens per month",
      "Premium 21st.dev Components",
      "AI Component Generation",
      "Unlimited UI Inspirations",
      "Unlimited SVG Logo Search",
      "Priority support",
    ],
    monthlyPrice: 20,
    yearlyPrice: 192,
    tokenPricing: {
      pricePerToken: {
        monthly: 0.4,
        yearly: 0.32,
      },
      componentCost: 5,
      generationCost: 1,
    },
  },
  pro_plus: {
    generationsPerMonth: 200,
    displayName: "Pro Plus",
    name: "Pro Plus",
    description: "For power users",
    features: [
      "200 tokens per month",
      "Premium 21st.dev Components",
      "AI Component Generation",
      "Unlimited UI Inspirations",
      "Unlimited SVG Logo Search",
      "Priority support + Private Discord channel",
    ],
    monthlyPrice: 40,
    yearlyPrice: 384,
    tokenPricing: {
      pricePerToken: {
        monthly: 0.2,
        yearly: 0.16,
      },
      componentCost: 5,
      generationCost: 1,
    },
  },
}

// Move Plan interface and COMPARISON_PLANS here, after PLAN_LIMITS
export interface Plan {
  name: string
  type: PlanType
  price: PlanPrice
  tokenPrice: {
    monthly: number
    yearly: number
  }
  tokens: number
  buttonText: string
  buttonHref?: string
  disabled?: boolean
  popular?: boolean
}

export const COMPARISON_PLANS: Plan[] = [
  {
    name: PLAN_LIMITS.free.displayName,
    type: "free",
    price: {
      monthly: 0,
      yearly: 0,
    },
    tokenPrice: PLAN_LIMITS.free.tokenPricing.pricePerToken,
    tokens: PLAN_LIMITS.free.generationsPerMonth,
    buttonText: "Current Plan",
    disabled: true,
  },
  {
    name: PLAN_LIMITS.pro.displayName,
    type: "pro",
    price: {
      monthly: PLAN_LIMITS.pro.monthlyPrice || 20,
      yearly: PLAN_LIMITS.pro.yearlyPrice || 192,
    },
    tokenPrice: PLAN_LIMITS.pro.tokenPricing.pricePerToken,
    tokens: PLAN_LIMITS.pro.generationsPerMonth,
    popular: true,
    buttonText: "Upgrade to Pro",
    buttonHref: "/upgrade",
  },
  {
    name: PLAN_LIMITS.pro_plus.displayName,
    type: "pro_plus",
    price: {
      monthly: PLAN_LIMITS.pro_plus.monthlyPrice || 40,
      yearly: PLAN_LIMITS.pro_plus.yearlyPrice || 384,
    },
    tokenPrice: PLAN_LIMITS.pro_plus.tokenPricing.pricePerToken,
    tokens: PLAN_LIMITS.pro_plus.generationsPerMonth,
    buttonText: "Upgrade to Pro Plus",
    buttonHref: "/pro_plus/create",
  },
]

export interface ComparisonFeature {
  name: string
  section: string
  values: Record<
    PlanType,
    | string
    | {
        monthly: string
        yearly: string
      }
  >
}

export const FREE_USAGE_LIMIT = 5

// Comparison features configuration for the comparison table
export const COMPARISON_FEATURES: ComparisonFeature[] = [
  {
    name: "Monthly Tokens",
    section: "Usage",
    values: {
      free: "5 free tokens",
      pro: "50 tokens",
      pro_plus: "200 tokens",
    },
  },
  {
    name: "Premium Components",
    section: "21st.dev",
    values: {
      free: "-",
      pro: {
        monthly: "$1.00 per component",
        yearly: "$0.80 per component",
      },
      pro_plus: {
        monthly: "$0.75 per component",
        yearly: "$0.60 per component",
      },
    },
  },
  {
    name: "AI Component Generation",
    section: "Magic MCP",
    values: {
      free: "$0.20 per generation",
      pro: {
        monthly: "$0.40 per generation",
        yearly: "$0.32 per generation",
      },
      pro_plus: {
        monthly: "$0.20 per generation",
        yearly: "$0.16 per generation",
      },
    },
  },
  {
    name: "UI Inspirations",
    section: "Magic MCP",
    values: {
      free: "Unlimited",
      pro: "Unlimited",
      pro_plus: "Unlimited",
    },
  },
  {
    name: "SVG Logo Search",
    section: "Magic MCP",
    values: {
      free: "Unlimited",
      pro: "Unlimited",
      pro_plus: "Unlimited",
    },
  },
  {
    name: "Support Type",
    section: "Support",
    values: {
      free: "Community",
      pro: "Priority",
      pro_plus: "Priority + Discord",
    },
  },
]

// Core features configuration that will be used in pricing table
export const PLAN_FEATURES: PlanFeature[] = [
  // Resource Allocation
  {
    name: "Monthly Tokens",
    included: "free",
    category: "Resources",
    valueByPlan: {
      free: "5 free tokens",
      pro: "50 tokens",
      pro_plus: "200 tokens",
    },
  },

  // Token Usage
  {
    name: "AI Generation",
    included: "free",
    category: "Resources",
    valueByPlan: {
      free: "$0.20 per generation",
      pro: "$0.20 monthly / $0.16 yearly per generation",
      pro_plus: "$0.15 monthly / $0.12 yearly per generation",
    },
  },
  {
    name: "Premium Component",
    included: "pro",
    category: "Resources",
    valueByPlan: {
      free: "Not available",
      pro: "$1.00 monthly / $0.80 yearly per component",
      pro_plus: "$0.75 monthly / $0.60 yearly per component",
    },
  },

  // Unlimited Features
  {
    name: "UI Inspiration Library",
    included: "free",
    category: "Unlimited Features",
    valueByPlan: {
      free: "Unlimited",
      pro: "Unlimited",
      pro_plus: "Unlimited",
    },
  },
  {
    name: "SVG Logo Search",
    included: "free",
    category: "Unlimited Features",
    valueByPlan: {
      free: "Unlimited",
      pro: "Unlimited",
      pro_plus: "Unlimited",
    },
  },

  // Support Options
  {
    name: "Support Level",
    included: "free",
    category: "Support",
    valueByPlan: {
      free: "Community",
      pro: "Priority",
      pro_plus: "Priority + Discord",
    },
  },
]

// Pricing plans configuration for the pricing table
export const PRICING_PLANS: PricingPlan[] = [
  {
    name: PLAN_LIMITS.free.displayName,
    level: "free",
    price: { monthly: 0, yearly: 0 },
  },
  {
    name: PLAN_LIMITS.pro.displayName,
    level: "pro",
    price: {
      monthly: PLAN_LIMITS.pro.monthlyPrice || 20,
      yearly: PLAN_LIMITS.pro.yearlyPrice || 192,
    },
    popular: true,
  },
  {
    name: PLAN_LIMITS.pro_plus.displayName,
    level: "pro_plus",
    price: {
      monthly: PLAN_LIMITS.pro_plus.monthlyPrice || 40,
      yearly: PLAN_LIMITS.pro_plus.yearlyPrice || 384,
    },
  },
]

/**
 * Helper functions
 */

export function getGenerationLimit(planType: PlanType): number {
  return (
    PLAN_LIMITS[planType]?.generationsPerMonth ||
    PLAN_LIMITS.free.generationsPerMonth
  )
}

export function getPlanInfo(planType: PlanType): PlanLimits {
  return PLAN_LIMITS[planType] || PLAN_LIMITS.free
}

export interface PricingCardPlan {
  name: string
  type: PlanType
  description: string
  monthlyPrice?: number
  yearlyPrice?: number
  features: string[]
  buttonText: string
  href: string
  isFeatured?: boolean
  price?: Record<string, number | string>
  cta?: string
  popular?: boolean
  highlighted?: boolean
}

export function getPricingCardPlans(options?: {
  standardButtonText?: string
  proButtonText?: string
  href?: string
  standardCheckoutLink?: string
  proCheckoutLink?: string
}): PricingCardPlan[] {
  const {
    standardButtonText = "Join waitlist",
    proButtonText = "Join waitlist",
    href = "#checkout",
    standardCheckoutLink,
    proCheckoutLink,
  } = options || {}

  return [
    {
      name: PLAN_LIMITS.pro.displayName,
      type: "pro",
      description: PLAN_LIMITS.pro.description,
      monthlyPrice: PLAN_LIMITS.pro.monthlyPrice,
      yearlyPrice: PLAN_LIMITS.pro.yearlyPrice,
      features: PLAN_LIMITS.pro.features,
      buttonText: standardButtonText,
      href: standardCheckoutLink || href,
      price: {
        monthly: PLAN_LIMITS.pro.monthlyPrice || 0,
        yearly: PLAN_LIMITS.pro.yearlyPrice || 0,
      },
      cta: standardButtonText,
    },
    {
      name: PLAN_LIMITS.pro_plus.displayName,
      type: "pro_plus",
      description: PLAN_LIMITS.pro_plus.description,
      monthlyPrice: PLAN_LIMITS.pro_plus.monthlyPrice,
      yearlyPrice: PLAN_LIMITS.pro_plus.yearlyPrice,
      features: PLAN_LIMITS.pro_plus.features,
      buttonText: proButtonText,
      href: proCheckoutLink || href,
      isFeatured: true,
      price: {
        monthly: PLAN_LIMITS.pro_plus.monthlyPrice || 0,
        yearly: PLAN_LIMITS.pro_plus.yearlyPrice || 0,
      },
      cta: proButtonText,
      popular: true,
    },
  ]
}

export function getTokenPrice(
  planType: PlanType,
  billingPeriod: "monthly" | "yearly" = "monthly",
): number {
  return (
    PLAN_LIMITS[planType]?.tokenPricing?.pricePerToken[billingPeriod] ||
    PLAN_LIMITS.pro.tokenPricing.pricePerToken[billingPeriod]
  )
}

export function getComponentCost(planType: PlanType): number {
  return (
    PLAN_LIMITS[planType]?.tokenPricing?.componentCost ||
    PLAN_LIMITS.pro.tokenPricing!.componentCost
  )
}

export function getGenerationCost(planType: PlanType): number {
  return (
    PLAN_LIMITS[planType]?.tokenPricing?.generationCost ||
    PLAN_LIMITS.pro.tokenPricing!.generationCost
  )
}
