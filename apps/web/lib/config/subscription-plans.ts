/**
 * Subscription plans configuration
 * This file contains all information about subscription plans, including limits, features, and pricing
 */

export type PlanType = "free" | "standard" | "pro"
export type PlanLevel = PlanType

interface PlanPrice {
  monthly: number
  yearly: number
}

export interface PlanFeature {
  name: string
  included: PlanType
  valueByPlan: Record<PlanType, string>
}

export interface PricingPlan {
  name: string
  level: PlanLevel
  price: PlanPrice
  popular?: boolean
}

export interface PlanLimits {
  generationsPerMonth: number
  displayName: string
  name: string
  description: string
  features: string[]
  monthlyPrice?: number
  yearlyPrice?: number
}

export const FREE_USAGE_LIMIT = 5

// Core features configuration that will be used in pricing table
export const PLAN_FEATURES: PlanFeature[] = [
  {
    name: "Monthly generations",
    included: "free",
    valueByPlan: {
      free: FREE_USAGE_LIMIT.toString(),
      standard: "50",
      pro: "200",
    },
  },
  {
    name: "Basic components",
    included: "free",
    valueByPlan: {
      free: "✓",
      standard: "✓",
      pro: "✓",
    },
  },
  {
    name: "SVGL logo library",
    included: "free",
    valueByPlan: {
      free: "✓",
      standard: "✓",
      pro: "✓",
    },
  },
  {
    name: "Community support",
    included: "free",
    valueByPlan: {
      free: "✓",
      standard: "✓",
      pro: "-",
    },
  },
  {
    name: "All components",
    included: "standard",
    valueByPlan: {
      free: "-",
      standard: "✓",
      pro: "✓",
    },
  },
  {
    name: "Revenue share",
    included: "standard",
    valueByPlan: {
      free: "-",
      standard: "50%",
      pro: "50%",
    },
  },
  {
    name: "Priority support",
    included: "pro",
    valueByPlan: {
      free: "-",
      standard: "-",
      pro: "✓",
    },
  },
]

// Plan limits and basic information
export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    generationsPerMonth: FREE_USAGE_LIMIT,
    displayName: "Hobby",
    name: "Hobby",
    description: "Perfect for trying out",
    features: [
      "5 generations per month",
      "Access to basic components",
      "Access to SVGL logo library",
      "Community support",
    ],
  },
  standard: {
    generationsPerMonth: 50,
    displayName: "Standard",
    name: "Standard",
    description: "For professional developers",
    features: [
      "50 generations per month",
      "Access to all components",
      "Access to SVGL logo library",
      "50% of revenue goes to component authors",
    ],
    monthlyPrice: 10,
    yearlyPrice: 98,
  },
  pro: {
    generationsPerMonth: 200,
    displayName: "Pro",
    name: "Pro",
    description: "For power users",
    features: [
      "200 generations per month",
      "Access to all components",
      "Access to SVGL logo library",
      "Priority support",
      "50% of revenue goes to component authors",
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
      yearly: PLAN_LIMITS.standard.yearlyPrice || 98,
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
