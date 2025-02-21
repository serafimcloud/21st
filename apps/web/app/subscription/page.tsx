"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PricingCard } from "@/components/ui/pricing-card"
import { Switch } from "@/components/ui/switch"
import { CheckoutDialog } from "@/components/ui/checkout-dialog"

export default function SubscriptionPage() {
  const [isYearly, setIsYearly] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState("growth")

  const getStripeCheckout = async () => {
    try {
      const response = await fetch("/api/stripe-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: selectedPlan,
          option: isYearly ? "annual" : "monthly",
        }),
      })
      return response.json()
    } catch (error) {
      console.error("Error getting Stripe checkout session:", error)
      throw error
    }
  }

  const handleCheckout = async () => {
    try {
      const checkoutSession = await getStripeCheckout()
      if (checkoutSession?.url) {
        window.location.href = checkoutSession.url
      } else {
        throw new Error("No checkout URL received")
      }
    } catch (error) {
      alert(
        "Error occurred during checkout. Please try again or contact support.",
      )
    }
  }

  const plans = [
    {
      name: "Growth Plan",
      description: "Perfect for growing your social media presence",
      monthlyPrice: 29,
      yearlyPrice: 290,
      features: [
        "600 replies per month",
        "Multi-language support",
        "Twitter & LinkedIn integration",
        "Basic analytics",
      ],
      buttonText: "Get Started",
      href: "#checkout",
    },
    {
      name: "Scale Plan",
      description: "For power users and teams",
      monthlyPrice: 99,
      yearlyPrice: 990,
      features: [
        "Unlimited replies",
        "Advanced analytics",
        "Priority support",
        "Custom integrations",
        "Team collaboration",
      ],
      buttonText: "Upgrade Now",
      href: "#checkout",
      isFeatured: true,
    },
  ]

  return (
    <div className="container max-w-6xl py-20">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Choose Your Plan</h1>
        <p className="text-muted-foreground text-lg">
          Skyrocket your social media growth with our powerful AI tools
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm">Monthly</span>
          <Switch checked={isYearly} onCheckedChange={setIsYearly} />
          <span className="text-sm">Yearly (Save 20%)</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <PricingCard
            key={plan.name}
            plan={plan}
            isYearly={isYearly}
            onClick={() => {
              setSelectedPlan(plan.name.toLowerCase().split(" ")[0])
              handleCheckout()
            }}
          />
        ))}
      </div>

      <CheckoutDialog
        selectedPlan={selectedPlan}
        isYearly={isYearly}
        onCheckout={handleCheckout}
      />
    </div>
  )
}
