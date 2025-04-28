"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { PlanComparisonTable } from "@/components/features/pricing/plan-comparison-table"
import { PricingSection } from "../../components/features/pricing/pricing-section"
import { FAQ } from "../../components/features/pricing/faq"
import {
  COMPARISON_PLANS,
  COMPARISON_FEATURES,
  PLAN_LIMITS,
  PlanType,
} from "@/lib/config/subscription-plans"
import { useSubscription, PlanInfo } from "@/hooks/use-subscription"
import { useAuth } from "@clerk/nextjs"

const PAYMENT_FREQUENCIES = ["yearly", "monthly"] as const

// Using consolidated configuration from PLAN_LIMITS
const TIERS = [
  {
    name: PLAN_LIMITS.pro.displayName,
    type: "pro" as PlanType,
    price: {
      monthly: PLAN_LIMITS.pro.monthlyPrice || 20,
      yearly: PLAN_LIMITS.pro.yearlyPrice || 192,
    },
    tokenPrice: {
      monthly: PLAN_LIMITS.pro.tokenPricing.pricePerToken.monthly,
      yearly: PLAN_LIMITS.pro.tokenPricing.pricePerToken.yearly,
    },
    tokens: 50,
    description: PLAN_LIMITS.pro.description,
    features: PLAN_LIMITS.pro.features,
    cta: "Upgrade",
    href: "/signup",
    popular: true,
  },
  {
    name: PLAN_LIMITS.pro_plus.displayName,
    type: "pro_plus" as PlanType,
    price: {
      monthly: PLAN_LIMITS.pro_plus.monthlyPrice || 40,
      yearly: PLAN_LIMITS.pro_plus.yearlyPrice || 384,
    },
    tokenPrice: {
      monthly: PLAN_LIMITS.pro_plus.tokenPricing.pricePerToken.monthly,
      yearly: PLAN_LIMITS.pro_plus.tokenPricing.pricePerToken.yearly,
    },
    tokens: 200,
    description: PLAN_LIMITS.pro_plus.description,
    features: PLAN_LIMITS.pro_plus.features,
    cta: "Upgrade Plus",
    href: "/signup",
    highlighted: true,
  },
]

const PRICING_FAQS = [
  {
    question: "What are tokens and how do they work?",
    answer:
      "Tokens are your currency for using AI features and accessing premium components. Each AI component generation costs 1 token, and unlocking a premium component from the library costs 5 tokens. Tokens reset monthly with your subscription.",
  },
  {
    question: "What happens if I run out of tokens?",
    answer:
      "When you run out of tokens, you'll need to wait until your next billing cycle when they reset, or upgrade your plan for more tokens. Unused tokens don't roll over to the next month.",
  },
  {
    question: "Can I switch plans at any time?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to more tokens and features. When downgrading, changes will take effect at the start of your next billing cycle.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We can provide partial refunds only for unused tokens and features. Since we incur costs for AI token usage through Anthropic Claude Sonnet, we cannot refund already used tokens and features. Contact our support team to discuss refund options for your unused subscription balance.",
  },
]

const handleUpgradePlan = async (
  planId: string,
  period: "monthly" | "yearly" = "monthly",
  isAuthenticated: boolean = false,
) => {
  if (!isAuthenticated) {
    // Return early - the SignInButton will handle the click
    return
  }

  try {
    console.log("Attempting upgrade with:", { planId, period })
    const response = await fetch("/api/stripe/create-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Ensure we have CSRF protection token if needed
        "csrf-token": (window as any).__NEXT_DATA__?.props?.csrfToken || "",
      },
      credentials: "include", // Include cookies and authentication headers
      body: JSON.stringify({
        planId,
        period,
        successUrl: `${window.location.origin}/dashboard?success=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Checkout creation failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })
      throw new Error(`Failed to create checkout session: ${errorData}`)
    }

    const data = await response.json()

    if (!data.url) {
      throw new Error("No checkout URL received from server")
    }

    window.location.href = data.url
  } catch (error) {
    console.error("Upgrade plan error:", error)
    toast.error("Failed to initiate upgrade. Please try again later.")
  }
}

const handleDowngradePlan = async () => {
  try {
    const response = await fetch("/api/stripe/cancel-subscription", {
      method: "POST",
    })

    if (!response.ok) throw new Error("Failed to downgrade subscription")

    toast.success("Plan successfully downgraded", {
      description:
        "Your subscription will downgrade at the end of the billing period",
    })
  } catch (error) {
    toast.error("Failed to downgrade subscription. Please try again later.")
  }
}

type SubscriptionPeriod = "monthly" | "yearly"

export function Pricing() {
  const [subscription, setSubscription] = useState<PlanInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { fetchSubscription } = useSubscription()
  const { isSignedIn } = useAuth()

  useEffect(() => {
    if (!isSignedIn) {
      setSubscription(null)
      setIsLoading(false)
      return
    }

    const getSubscription = async () => {
      setIsLoading(true)
      try {
        const result = await fetchSubscription()
        setSubscription(result)
      } finally {
        setIsLoading(false)
      }
    }

    getSubscription()
  }, [fetchSubscription, isSignedIn])

  const currentPlan = isSignedIn ? subscription?.type || "free" : "free"
  const currentFrequency = subscription?.period as
    | SubscriptionPeriod
    | undefined

  const handlePlanSelect = (event: React.MouseEvent<HTMLDivElement>) => {
    console.log("Plan selected:", event)
    // Add your plan selection logic here
  }

  return (
    <div className="container px-4 max-w-6xl space-y-24 py-3 sm:py-6">
      <div className="relative">
        <div className="absolute inset-0 -z-10">
          <div className="h-full w-full bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:14px_14px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        </div>
        <PricingSection
          frequencies={PAYMENT_FREQUENCIES}
          tiers={TIERS}
          currentPlan={currentPlan}
          currentFrequency={currentFrequency}
          onUpgrade={(planId, period) =>
            handleUpgradePlan(planId, period, isSignedIn)
          }
          onDowngrade={handleDowngradePlan}
          isAuthenticated={isSignedIn}
        />
      </div>

      {/* Compare Plans Section */}
      <div className="hidden md:block">
        <PlanComparisonTable
          features={COMPARISON_FEATURES}
          plans={COMPARISON_PLANS}
          currentPlan={currentPlan}
          currentFrequency={currentFrequency}
          onSelect={handlePlanSelect}
          onUpgrade={(planId, period) =>
            handleUpgradePlan(planId, period, isSignedIn)
          }
          onDowngrade={handleDowngradePlan}
          isAuthenticated={isSignedIn}
        />
      </div>

      {/* FAQ Section */}
      <FAQ simplified={false} faqs={PRICING_FAQS} />
    </div>
  )
}
