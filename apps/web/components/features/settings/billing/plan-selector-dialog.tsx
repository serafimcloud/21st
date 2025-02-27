"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PricingCard } from "@/components/ui/pricing-card"
import {
  PlanType,
  PLAN_LIMITS,
  getPricingCardPlans,
} from "@/lib/subscription-limits"
import { useAuth } from "@clerk/nextjs"

interface PlanInfo {
  name: string
  type: PlanType
  period?: string | null
  periodEnd?: string | null
}

interface PlanSelectorDialogProps {
  isOpen?: boolean
  open?: boolean
  onOpenChange: (open: boolean) => void
  userId?: string | null
  currentPlan?: string
  onPlanUpdated?: (newPlan: PlanInfo) => void
}

export function PlanSelectorDialog({
  isOpen,
  open,
  onOpenChange,
  userId,
  currentPlan = "free",
  onPlanUpdated,
}: PlanSelectorDialogProps) {
  const { userId: authUserId } = useAuth()
  const [isYearly, setIsYearly] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<"standard" | "pro">(
    "standard",
  )

  // Use open or isOpen to determine dialog state
  const dialogOpen = open !== undefined ? open : isOpen

  // Use userId from props or from auth
  const effectiveUserId = userId || authUserId

  const handleCheckout = async (planType: "standard" | "pro") => {
    if (!effectiveUserId) {
      toast.error("You must be logged in to subscribe")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: planType,
          period: isYearly ? "yearly" : "monthly",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const checkoutSession = await response.json()
      if (checkoutSession?.url) {
        if (onPlanUpdated) {
          const newPlan: PlanInfo = {
            name: PLAN_LIMITS[planType].displayName,
            type: planType,
            period: isYearly ? "yearly" : "monthly",
          }
          onPlanUpdated(newPlan)
        }

        window.location.href = checkoutSession.url
      } else {
        throw new Error("No checkout URL received")
      }
    } catch (error) {
      toast.error("Error processing subscription. Please try again later.")
      console.error("Checkout error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get plans from configuration
  const plans = getPricingCardPlans({
    standardButtonText: "Select",
    proButtonText: "Select",
    standardCheckoutLink: "#",
    proCheckoutLink: "#",
  })

  return (
    <Dialog open={dialogOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Choose a Subscription Plan</DialogTitle>
          <DialogDescription>
            Select the plan that best fits your needs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-7 text-center">
          <div className="flex items-center justify-center gap-2 my-4">
            <span className="text-sm">Monthly</span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className="text-sm">Yearly (Save 20%)</span>
          </div>
        </div>

        <div className="container grid max-w-5xl gap-6 px-0 sm:grid-cols-2">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              isYearly={isYearly}
              isLoading={isLoading && selectedPlan === plan.type}
              onClick={() => {
                setSelectedPlan(plan.type as "standard" | "pro")
                handleCheckout(plan.type as "standard" | "pro")
              }}
              isFeatured={plan.type === "pro"}
              isActive={plan.type === currentPlan}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
