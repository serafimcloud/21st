/**
 * Subscription plans configuration
 * This file contains all information about subscription plans, including limits, features, and pricing
 */

import {
  PlanType,
  PlanPrice,
  PlanFeature,
  PricingPlan,
  PlanLimits,
} from "@/types/global"
import { ReactNode } from "react"

export type { PlanType }

export interface Plan {
  name: string
  type: PlanType
  price: PlanPrice
  buttonText: string
  buttonHref?: string
  disabled?: boolean
  popular?: boolean
}

export interface ComparisonFeature {
  name: string
  section: string
  values: Record<PlanType, ReactNode>
}

export const FREE_USAGE_LIMIT = 5

// Comparison plans configuration for the comparison table
export const COMPARISON_PLANS: Plan[] = [
  {
    name: "Free",
    type: "free",
    price: {
      monthly: 0,
      yearly: 0,
    },
    buttonText: "Current Plan",
    disabled: true,
  },
  {
    name: "Pro",
    type: "standard",
    price: {
      monthly: 10,
      yearly: 96,
    },
    popular: true,
    buttonText: "Upgrade to Pro",
    buttonHref: "/upgrade",
  },
  {
    name: "Pro Plus",
    type: "pro",
    price: {
      monthly: 30,
      yearly: 288,
    },
    buttonText: "Upgrade to Pro Plus",
    buttonHref: "/pro/create",
  },
]

// Comparison features configuration for the comparison table
export const COMPARISON_FEATURES: ComparisonFeature[] = [
  {
    name: "Monthly Tokens",
    section: "Usage",
    values: {
      free: "5 tokens",
      standard: "50 tokens",
      pro: "200 tokens",
    },
  },
  {
    name: "Premium Components",
    section: "21st.dev",
    values: {
      free: "-",
      standard: "5 tokens each",
      pro: "5 tokens each",
    },
  },
  {
    name: "AI Component Generation",
    section: "Magic MCP",
    values: {
      free: "1 token per generation",
      standard: "1 token per generation",
      pro: "1 token per generation",
    },
  },
  {
    name: "UI Inspirations",
    section: "Magic MCP",
    values: {
      free: "Unlimited",
      standard: "Unlimited",
      pro: "Unlimited",
    },
  },
  {
    name: "SVG Logo Search",
    section: "Magic MCP",
    values: {
      free: "Unlimited",
      standard: "Unlimited",
      pro: "Unlimited",
    },
  },
  {
    name: "Support Type",
    section: "Support",
    values: {
      free: "Community",
      standard: "Priority",
      pro: "Priority + Discord",
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
      free: "5 tokens",
      standard: "50 tokens",
      pro: "200 tokens",
    },
  },

  // Token Usage
  {
    name: "AI Generation",
    included: "free",
    category: "Resources",
    valueByPlan: {
      free: "1 token per generation",
      standard: "1 token per generation",
      pro: "1 token per generation",
    },
  },
  {
    name: "Premium Component",
    included: "standard",
    category: "Resources",
    valueByPlan: {
      free: "Not available",
      standard: "5 tokens each",
      pro: "5 tokens each",
    },
  },

  // Unlimited Features
  {
    name: "UI Inspiration Library",
    included: "free",
    category: "Unlimited Features",
    valueByPlan: {
      free: "Unlimited",
      standard: "Unlimited",
      pro: "Unlimited",
    },
  },
  {
    name: "SVG Logo Search",
    included: "free",
    category: "Unlimited Features",
    valueByPlan: {
      free: "Unlimited",
      standard: "Unlimited",
      pro: "Unlimited",
    },
  },

  // Support Options
  {
    name: "Support Level",
    included: "free",
    category: "Support",
    valueByPlan: {
      free: "Community",
      standard: "Priority",
      pro: "Priority + Discord",
    },
  },
]

// Plan limits and basic information
export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    generationsPerMonth: FREE_USAGE_LIMIT,
    displayName: "Free",
    name: "Free",
    description: "Perfect for trying out",
    features: [
      "5 tokens per month",
      "AI Component Generation (1 token each)",
      "Unlimited UI Inspirations",
      "Unlimited SVG Logo Search",
      "Community support",
    ],
  },
  standard: {
    generationsPerMonth: 50,
    displayName: "Pro",
    name: "Pro",
    description: "For professional developers",
    features: [
      "50 tokens per month",
      "AI Component Generation (1 token each)",
      "Unlimited UI Inspirations",
      "Unlimited SVG Logo Search",
      "Premium Components (5 tokens each)",
      "Priority support",
    ],
    monthlyPrice: 10,
    yearlyPrice: 96,
  },
  pro: {
    generationsPerMonth: 200,
    displayName: "Pro Plus",
    name: "Pro Plus",
    description: "For power users",
    features: [
      "200 tokens per month",
      "AI Component Generation (1 token each)",
      "Unlimited UI Inspirations",
      "Unlimited SVG Logo Search",
      "Premium Components (5 tokens each)",
      "Priority support + Private Discord channel",
    ],
    monthlyPrice: 30,
    yearlyPrice: 288,
  },
}

// Pricing plans configuration for the pricing table
export const PRICING_PLANS: PricingPlan[] = [
  {
    name: PLAN_LIMITS.free.displayName,
    level: "free",
    price: { monthly: 0, yearly: 0 },
  },
  {
    name: PLAN_LIMITS.standard.displayName,
    level: "standard",
    price: {
      monthly: PLAN_LIMITS.standard.monthlyPrice || 10,
      yearly: PLAN_LIMITS.standard.yearlyPrice || 96,
    },
    popular: true,
  },
  {
    name: PLAN_LIMITS.pro.displayName,
    level: "pro",
    price: {
      monthly: PLAN_LIMITS.pro.monthlyPrice || 30,
      yearly: PLAN_LIMITS.pro.yearlyPrice || 288,
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
      name: PLAN_LIMITS.standard.displayName,
      type: "standard",
      description: PLAN_LIMITS.standard.description,
      monthlyPrice: PLAN_LIMITS.standard.monthlyPrice,
      yearlyPrice: PLAN_LIMITS.standard.yearlyPrice,
      features: PLAN_LIMITS.standard.features,
      buttonText: standardButtonText,
      href: standardCheckoutLink || href,
      price: {
        monthly: PLAN_LIMITS.standard.monthlyPrice || 0,
        yearly: PLAN_LIMITS.standard.yearlyPrice || 0,
      },
      cta: standardButtonText,
    },
    {
      name: PLAN_LIMITS.pro.displayName,
      type: "pro",
      description: PLAN_LIMITS.pro.description,
      monthlyPrice: PLAN_LIMITS.pro.monthlyPrice,
      yearlyPrice: PLAN_LIMITS.pro.yearlyPrice,
      features: PLAN_LIMITS.pro.features,
      buttonText: proButtonText,
      href: proCheckoutLink || href,
      isFeatured: true,
      price: {
        monthly: PLAN_LIMITS.pro.monthlyPrice || 0,
        yearly: PLAN_LIMITS.pro.yearlyPrice || 0,
      },
      cta: proButtonText,
      popular: true,
    },
  ]
}
