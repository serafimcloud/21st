/**
 * Subscription plan limits configuration
 * This file contains the limits for different subscription plans
 */

export type PlanType = "free" | "standard" | "pro"

export interface PlanLimits {
  /** Number of generations allowed per month */
  generationsPerMonth: number
  /** Display name of the plan */
  displayName: string
  /** Name of the plan (alias for displayName) */
  name: string
  /** Description of the plan */
  description: string
  /** Features of the plan */
  features: string[]
  /** Monthly price in USD */
  monthlyPrice?: number
  /** Yearly price in USD */
  yearlyPrice?: number
}

/**
 * Plan limits configuration
 * These values should match the values in the database (plans.add_usage)
 */
export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    generationsPerMonth: 5,
    displayName: "Hobby Plan",
    name: "Hobby Plan",
    description: "Basic features with limitations",
    features: [
      "5 generations per month",
      "Basic components",
      "Community support",
    ],
  },
  standard: {
    generationsPerMonth: 50,
    displayName: "Standard Plan",
    name: "Standard Plan",
    description: "Enhanced features for growing projects",
    features: [
      "50 generations per month",
      "Multi-language support",
      "Basic analytics",
      "Priority support",
    ],
    monthlyPrice: 10,
    yearlyPrice: 98,
  },
  pro: {
    generationsPerMonth: 200,
    displayName: "Pro Plan",
    name: "Pro Plan",
    description: "Full access to all features",
    features: [
      "200 generations per month",
      "Advanced analytics",
      "24/7 priority support",
      "Custom integrations",
      "Team collaboration",
    ],
    monthlyPrice: 30,
    yearlyPrice: 288,
  },
}

/**
 * Get the generation limit for a specific plan type
 * @param planType The type of plan
 * @returns The number of generations allowed per month
 */
export function getGenerationLimit(planType: PlanType): number {
  return (
    PLAN_LIMITS[planType]?.generationsPerMonth ||
    PLAN_LIMITS.free.generationsPerMonth
  )
}

/**
 * Get the plan information by type
 * @param planType The type of plan
 * @returns The plan information
 */
export function getPlanInfo(planType: PlanType): PlanLimits {
  return PLAN_LIMITS[planType] || PLAN_LIMITS.free
}

/**
 * Interface for pricing card plan data
 */
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

/**
 * Get pricing card plans for subscription page
 * @param options Options for customizing the plans
 * @returns Array of pricing card plans
 */
export function getPricingCardPlans(options?: {
  standardButtonText?: string
  proButtonText?: string
  href?: string
  standardCheckoutLink?: string
  proCheckoutLink?: string
}): PricingCardPlan[] {
  const {
    standardButtonText = "Get Started",
    proButtonText = "Upgrade Now",
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
