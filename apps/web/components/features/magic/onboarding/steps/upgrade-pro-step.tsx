"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Check, CheckCircle, LoaderCircle } from "lucide-react"
import { ApiKey } from "@/types/global"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Icons } from "@/components/icons"
import { toast } from "sonner"

type PlanType = "free" | "standard" | "pro" | "enterprise"

interface PlanLimits {
  generationsPerMonth: number | "Unlimited"
  displayName: string
  description: string
}

interface UpgradeProStepProps {
  apiKey: ApiKey | null
  onComplete: () => void
}

export function UpgradeProStep({ apiKey, onComplete }: UpgradeProStepProps) {
  const isPro = apiKey?.plan === "pro" || apiKey?.plan === "enterprise"
  const currentPlan = (apiKey?.plan || "free") as PlanType
  const [isUpgradeLoading, setIsUpgradeLoading] = useState(false)

  // Determine which plan to show as upgrade
  let upgradePlan: PlanType | null = null
  if (currentPlan === "free") {
    upgradePlan = "standard"
  } else if (currentPlan === "standard") {
    upgradePlan = "pro"
  }

  // Add keyboard shortcut for Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        onComplete()
      } else if (e.key === "u" || e.key === "U") {
        e.preventDefault()
        // Navigate to billing page if there's an upgrade option
        if (upgradePlan) {
          handleUpgradePlan(upgradePlan)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onComplete, upgradePlan])

  const handleUpgradePlan = async (planId: PlanType) => {
    setIsUpgradeLoading(true)
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          period: "monthly",
          successUrl: `${window.location.origin}/settings/billing?success=true`,
          cancelUrl: `${window.location.origin}/settings/billing?canceled=true`,
          isUpgrade: true,
          currentPlanId: currentPlan,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create checkout session")
      }

      const data = await response.json()

      if (data.directly_upgraded) {
        toast.success("Plan successfully upgraded", {
          description: "Your subscription has been upgraded to the new plan",
          duration: 5000,
        })

        // Redirect to billing page to see updated subscription
        window.location.href = "/settings/billing"
      } else {
        window.location.href = data.url
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to initiate plan change process. Please try again later.",
      )
    } finally {
      setIsUpgradeLoading(false)
    }
  }

  // Define plan limits based on plan type
  const getPlanLimits = (plan: PlanType): PlanLimits => {
    switch (plan) {
      case "free":
        return {
          generationsPerMonth: 100,
          displayName: "Hobby",
          description: "Perfect for trying out",
        }
      case "standard":
        return {
          generationsPerMonth: 1000,
          displayName: "Standard",
          description: "For professional developers",
        }
      case "pro":
        return {
          generationsPerMonth: "Unlimited",
          displayName: "Pro",
          description: "For power users",
        }
      case "enterprise":
        return {
          generationsPerMonth: "Unlimited",
          displayName: "Enterprise",
          description: "Custom enterprise solution",
        }
      default:
        return {
          generationsPerMonth: 100,
          displayName: "Hobby",
          description: "Perfect for trying out",
        }
    }
  }

  const currentPlanLimits = getPlanLimits(currentPlan)
  const upgradePlanLimits = upgradePlan ? getPlanLimits(upgradePlan) : null

  // Mock usage data - in a real app, this would come from the API
  const usageCount = 30
  const usageLimit =
    typeof currentPlanLimits.generationsPerMonth === "number"
      ? currentPlanLimits.generationsPerMonth
      : 1000000

  const calculateProgressOffset = (used: number, limit: number) => {
    return 2 * Math.PI * 8 * (1 - used / limit)
  }

  const getAdditionalGenerations = (
    current: PlanLimits,
    upgrade: PlanLimits,
  ) => {
    if (typeof upgrade.generationsPerMonth === "string") {
      return upgrade.generationsPerMonth
    }
    if (typeof current.generationsPerMonth === "string") {
      return upgrade.generationsPerMonth
    }
    return (
      upgrade.generationsPerMonth - current.generationsPerMonth
    ).toLocaleString()
  }

  return (
    <div className="flex flex-col space-y-8 px-4">
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Upgrade to Pro</h1>
        <p className="text-lg text-muted-foreground">
          Get unlimited access to Magic MCP and premium features
        </p>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Current plan block */}
        <div className="space-y-2">
          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="p-4 flex justify-between">
              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">
                      {currentPlanLimits.displayName}
                    </h3>
                    <span className="bg-muted/80 text-accent-foreground px-2 py-0.5 rounded-sm text-xs border shadow-inner">
                      Current plan
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentPlanLimits.description}
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-between items-end">
                <div className="text-xs text-muted-foreground">
                  Monthly limit
                </div>
                <div className="flex items-center gap-2">
                  <svg height="22" width="22">
                    <circle
                      className="text-border"
                      cx="11"
                      cy="11"
                      fill="transparent"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <circle
                      className="text-primary"
                      cx="11"
                      cy="11"
                      fill="transparent"
                      r="8"
                      stroke="currentColor"
                      strokeDasharray={`${2 * Math.PI * 8}`}
                      strokeLinecap="round"
                      strokeWidth="3"
                      strokeDashoffset={`${calculateProgressOffset(usageCount, usageLimit)}`}
                    />
                  </svg>
                  <div className="text-sm">
                    {usageCount.toLocaleString()} /{" "}
                    {typeof usageLimit === "number"
                      ? usageLimit.toLocaleString()
                      : usageLimit}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Plan Block - show only if there's an upgrade option */}
        {upgradePlan && upgradePlanLimits && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              Upgrade to {upgradePlanLimits.displayName}
            </h3>

            <div className="bg-background rounded-lg border border-border overflow-hidden">
              <div className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">
                    ${upgradePlan === "standard" ? "10" : "30"} per month
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {upgradePlanLimits.description}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <span className="text-xs">
                      <strong>
                        {upgradePlan === "standard" && upgradePlanLimits
                          ? getAdditionalGenerations(
                              currentPlanLimits,
                              upgradePlanLimits,
                            )
                          : upgradePlanLimits?.generationsPerMonth}
                      </strong>{" "}
                      additional generations per month
                    </span>
                  </div>

                  {/* Additional features */}
                  {upgradePlan === "standard" && (
                    <>
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span className="text-xs">
                          Premium component library
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span className="text-xs">Priority support</span>
                      </div>
                    </>
                  )}

                  {upgradePlan === "pro" && (
                    <>
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span className="text-xs">
                          Premium component library
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span className="text-xs">Priority support</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span className="text-xs">Advanced AI features</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span className="text-xs">Custom integrations</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-muted p-3 rounded-b-lg flex justify-end border-t">
                <Button
                  onClick={() => handleUpgradePlan(upgradePlan)}
                  disabled={isUpgradeLoading}
                >
                  {isUpgradeLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-3 w-3 animate-spin" />
                      Processing
                    </>
                  ) : (
                    <>
                      Upgrade plan
                      <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-muted leading-none opacity-100 flex">
                        U
                      </kbd>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center w-full mt-8">
        <Button onClick={onComplete}>
          Complete Onboarding
          <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-muted leading-none opacity-100 flex">
            <Icons.enter className="h-2.5 w-2.5" />
          </kbd>
        </Button>
      </div>
    </div>
  )
}
