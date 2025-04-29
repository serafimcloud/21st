"use client"

import { Button } from "@/components/ui/button"
import { Check, LoaderCircle } from "lucide-react"
import { ApiKey } from "@/types/global"
import { useEffect, useState } from "react"
import { Icons } from "@/components/icons"
import { Spinner } from "@/components/icons/spinner"
import { toast } from "sonner"
import { PLAN_LIMITS, PlanType } from "@/lib/config/subscription-plans"
import { CircleProgress } from "@/components/ui/circle-progress"
import {
  trackAttribution,
  ATTRIBUTION_SOURCE,
  SOURCE_DETAIL,
} from "@/lib/attribution-tracking"

interface UpgradeProStepProps {
  apiKey: ApiKey | null
  onComplete: () => void
}

export function UpgradeProStep({ apiKey, onComplete }: UpgradeProStepProps) {
  const currentPlan = (apiKey?.plan || "free") as PlanType
  const [isUpgradeLoading, setIsUpgradeLoading] = useState(false)
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false)

  // Determine which plan to show as upgrade
  let upgradePlan: PlanType | null = null
  if (currentPlan === "free") {
    upgradePlan = "pro"
  } else if (currentPlan === "pro") {
    upgradePlan = "pro_plus"
  }

  // Add keyboard shortcut for Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleCompleteOnboarding()
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

  const handleCompleteOnboarding = () => {
    if (isCompletingOnboarding) return
    setIsCompletingOnboarding(true)
    onComplete()
  }

  const handleUpgradePlan = async (planId: PlanType) => {
    // Track attribution when upgrading from onboarding
    trackAttribution(ATTRIBUTION_SOURCE.MAGIC, SOURCE_DETAIL.MAGIC_ONBOARDING)

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
          attributionSource: ATTRIBUTION_SOURCE.MAGIC,
          sourceDetail: SOURCE_DETAIL.MAGIC_ONBOARDING,
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

  // Mock usage data - in a real app, this would come from the API
  const usageCount = 30
  const usageLimit = PLAN_LIMITS[currentPlan].generationsPerMonth

  const calculateProgressOffset = (used: number, limit: number) => {
    return 2 * Math.PI * 8 * (1 - used / limit)
  }

  return (
    <div className="flex flex-col space-y-8 px-4 max-w-[700px] mx-auto">
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
            <div className="p-4 flex flex-col md:flex-row md:justify-between gap-4 md:gap-0">
              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">
                      {PLAN_LIMITS[currentPlan].displayName}
                    </h3>
                    <span className="bg-muted/80 text-accent-foreground px-2 py-0.5 rounded-sm text-xs border shadow-inner">
                      Current plan
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {PLAN_LIMITS[currentPlan].description}
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-between items-end space-y-3">
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center">
                    <div className="w-5 mr-2">
                      <CircleProgress progress={usageCount / usageLimit} />
                    </div>
                    <div className="text-sm text-foreground">
                      New UI Generations
                    </div>
                  </div>
                  <div className="text-sm tabular-nums">
                    {usageCount.toLocaleString()} /{" "}
                    {usageLimit.toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center">
                    <div className="w-5 mr-2 flex justify-center items-center">
                      <div className="flex items-center justify-center h-6 w-6 p-1 pb-2">
                        <span className="text-[22px] leading-none">∞</span>
                      </div>
                    </div>
                    <div className="text-sm text-foreground">
                      UI Inspirations
                    </div>
                  </div>
                  <span className="bg-muted/80 text-accent-foreground px-2 py-0.5 rounded-sm text-xs border shadow-inner">
                    unlimited
                  </span>
                </div>
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center">
                    <div className="w-5 mr-2 flex justify-center items-center">
                      <div className="flex items-center justify-center h-6 w-6 p-1 pb-2">
                        <span className="text-[22px] leading-none">∞</span>
                      </div>
                    </div>
                    <div className="text-sm text-foreground">
                      SVG Logo Searches
                    </div>
                  </div>
                  <span className="bg-muted/80 text-accent-foreground px-2 py-0.5 rounded-sm text-xs border shadow-inner">
                    unlimited
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Plan Block - show only if there's an upgrade option */}
        {upgradePlan && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              Upgrade to {PLAN_LIMITS[upgradePlan].displayName}
            </h3>

            <div className="bg-background rounded-lg border border-border overflow-hidden">
              <div className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">
                    ${PLAN_LIMITS[upgradePlan].monthlyPrice} per month
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {PLAN_LIMITS[upgradePlan].description}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <span className="text-xs">
                      <strong>
                        {PLAN_LIMITS[upgradePlan].generationsPerMonth -
                          PLAN_LIMITS[currentPlan].generationsPerMonth}
                      </strong>{" "}
                      additional generations per month
                    </span>
                  </div>

                  {/* Additional features unique to the upgrade plan */}
                  {PLAN_LIMITS[upgradePlan].features
                    .filter(
                      (feature) =>
                        !PLAN_LIMITS[currentPlan].features.includes(feature),
                    )
                    .map((feature, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span className="text-xs">{feature}</span>
                      </div>
                    ))}
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
                      <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-kbd leading-none opacity-100 flex">
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
        <Button
          onClick={handleCompleteOnboarding}
          disabled={isCompletingOnboarding}
        >
          {isCompletingOnboarding ? (
            <div className="flex items-center">
              <Spinner size={16} color="#fff" />
              <span className="ml-2">Complete Onboarding</span>
            </div>
          ) : (
            <>
              Complete Onboarding
              <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-kbd leading-none opacity-100 flex">
                <Icons.enter className="h-2.5 w-2.5" />
              </kbd>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
