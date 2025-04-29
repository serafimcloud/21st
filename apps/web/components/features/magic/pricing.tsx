"use client"

import { PricingSection } from "@/components/ui/pricing-section"

const PAYMENT_FREQUENCIES = ["monthly", "yearly"]

const TIERS = [
  {
    name: "Hobby",
    price: {
      monthly: "0",
      yearly: "0",
    },
    description: "Perfect for trying out",
    features: [
      "5 generations per month",
      "Unlimited UI Inspirations",
      "Unlimited SVG Logo Searches",
      "Access to basic components",
      "Community support",
    ],
    cta: "Get Started",
    href: "/magic/get-started",
  },
  {
    name: "Pro",
    price: {
      monthly: 20,
      yearly: 192,
    },
    description: "For professional developers",
    features: [
      "50 generations per month",
      "Unlimited UI Inspirations",
      "Unlimited SVG Logo Searches",
      "Access to all components",
      "Priority support",
      "50% of revenue goes to component authors",
    ],
    cta: "Get Started",
    href: "/magic/get-started",
    popular: true,
  },
  {
    name: "Pro Plus",
    price: {
      monthly: 40,
      yearly: 384,
    },
    description: "For power users",
    features: [
      "200 generations per month",
      "Unlimited UI Inspirations",
      "Unlimited SVG Logo Searches",
      "Access to all components",
      "Priority support",
      "50% of revenue goes to component authors",
    ],
    cta: "Get Started",
    href: "/magic/get-started",
    highlighted: true,
  },
]

export function Pricing() {
  return (
    <div className="relative flex justify-center items-center w-full">
      <div className="absolute inset-0 -z-10">
        <div className="h-full w-full bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:14px_14px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>
      <PricingSection
        title="Pricing"
        subtitle="Choose the plan that best fits your needs"
        frequencies={PAYMENT_FREQUENCIES as [string, ...string[]]}
        tiers={TIERS}
      />
    </div>
  )
}
