"use client"

import { useState } from "react"
import { PlanInfo } from "@/app/settings/billing/page"
import { TroubleshootingSection } from "@/components/features/magic/troubleshooting"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, LoaderCircle } from "lucide-react"
import { PLAN_LIMITS, PlanType } from "@/lib/config/subscription-plans"
import { toast } from "sonner"
import { UpgradeConfirmationDialog } from "@/components/features/settings/billing/upgrade-confirmation-dialog"
import { CircleProgress } from "@/components/ui/circle-progress"

interface ConsoleClientProps {
  subscription: PlanInfo | null
}

export function ConsoleClient({
  subscription: initialSubscription,
}: ConsoleClientProps) {
  const [subscription, setSubscription] = useState<PlanInfo | null>(
    initialSubscription,
  )
  const usageCount = subscription?.usage || 0
  const usageLimit = subscription?.limit || 5
  const currentPlanId = subscription?.type || "free"

  const [isUpgradeLoading, setIsUpgradeLoading] = useState(false)
  const [upgradeConfirmation, setUpgradeConfirmation] = useState<{
    open: boolean
    planId: PlanType
  }>({
    open: false,
    planId: "standard",
  })

  // Determine which plan to show as upgrade
  let upgradePlanId: PlanType | null = null
  if (currentPlanId === "free") {
    upgradePlanId = "standard"
  } else if (currentPlanId === "standard") {
    upgradePlanId = "pro"
  }

  const handleUpgradePlan = async (
    planId: PlanType,
    period: "monthly" | "yearly" = "monthly",
  ) => {
    setIsUpgradeLoading(true)
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          period,
          successUrl: `${window.location.origin}/magic/console?success=true`,
          cancelUrl: `${window.location.origin}/magic/console?canceled=true`,
          isUpgrade: true,
          currentPlanId: currentPlanId,
          subscriptionId: subscription?.stripe_subscription_id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create checkout session")
      }

      const data = await response.json()

      if (data.directly_upgraded) {
        const planOrder = { pro: 3, standard: 2, free: 1 }
        const isDowngrade = planOrder[planId] < planOrder[currentPlanId]

        toast.success(
          isDowngrade
            ? "Plan successfully downgraded"
            : "Plan successfully upgraded",
          {
            description: isDowngrade
              ? "Your subscription will be changed at the end of your current billing period"
              : "Your subscription has been upgraded to the new plan",
            duration: 5000,
          },
        )

        // Optimistically update the subscription state
        if (subscription) {
          const newLimit = PLAN_LIMITS[planId].generationsPerMonth
          setSubscription({
            ...subscription,
            type: planId,
            name: PLAN_LIMITS[planId].displayName,
            period: period,
            limit: newLimit,
            cancel_at_period_end: false,
          })
        }
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

  const confirmUpgrade = (planId: PlanType) => {
    setUpgradeConfirmation({
      open: true,
      planId,
    })
  }

  return (
    <div className="min-h-screen w-full bg-background antialiased mt-14">
      <div className="p-3 sm:p-6">
        <div className="space-y-6">
          {/* Current plan block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-4 border-b mb-4">
              <h3 className="font-medium">Current Plan</h3>
              <Link
                href="/settings/billing"
                className="text-muted-foreground hover:text-primary text-sm"
              >
                Manage subscription
              </Link>
            </div>
            <div className="bg-background rounded-lg border border-border overflow-hidden">
              <div className="p-4 flex justify-between">
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">
                        {subscription?.name || "Hobby"}
                      </h3>
                      <span className="bg-muted/80 text-accent-foreground px-2 py-0.5 rounded-sm text-xs border shadow-inner">
                        Current plan
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {subscription?.type === "free"
                        ? "Perfect for trying out"
                        : subscription?.type === "standard"
                          ? "For professional developers"
                          : "For power users"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col justify-between items-end">
                  <div className="text-xs text-muted-foreground">
                    Monthly limit
                  </div>
                  <div className="flex items-center gap-2">
                    <CircleProgress progress={usageCount / usageLimit} />
                    <div className="text-sm">
                      {usageCount.toLocaleString()} /{" "}
                      {usageLimit.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {subscription?.current_period_end && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-muted-foreground">
                    Active until{" "}
                    {new Date(
                      subscription.current_period_end,
                    ).toLocaleDateString()}
                    {subscription.cancel_at_period_end &&
                      " (will be canceled at the end of period)"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upgrade Plan Block - show only if there's an upgrade option */}
          {upgradePlanId && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">
                Upgrade to {PLAN_LIMITS[upgradePlanId].displayName}
              </h3>

              <div className="bg-background rounded-lg border border-border overflow-hidden">
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium">
                      ${upgradePlanId === "standard" ? "10" : "30"} per month
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {PLAN_LIMITS[upgradePlanId].description}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span className="text-xs">
                        <strong>
                          {PLAN_LIMITS[upgradePlanId].generationsPerMonth -
                            PLAN_LIMITS[currentPlanId].generationsPerMonth}
                        </strong>{" "}
                        additional generations per month
                      </span>
                    </div>

                    {/* Additional features unique to the upgrade plan */}
                    {PLAN_LIMITS[upgradePlanId].features
                      ?.filter(
                        (feature: string) =>
                          !PLAN_LIMITS[currentPlanId].features?.includes(
                            feature,
                          ),
                      )
                      .map((feature: string, index: number) => (
                        <div key={index} className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span className="text-xs">{feature}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-b-lg flex justify-end border-t ">
                  <Button
                    disabled={isUpgradeLoading}
                    onClick={() => confirmUpgrade(upgradePlanId as PlanType)}
                  >
                    {isUpgradeLoading ? (
                      <>
                        <LoaderCircle className="mr-2 h-3 w-3 animate-spin" />
                        Processing
                      </>
                    ) : (
                      "Upgrade plan"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Troubleshooting */}
          <div className="space-y-2 mt-8">
            <div className="flex items-center justify-between pb-4 border-b mb-4">
              <h3 className="font-medium">Troubleshooting Guide</h3>
              <Link
                href="https://discord.gg/Qx4rFunHfm"
                target="_blank"
                className="text-muted-foreground hover:text-primary text-sm"
              >
                Get help on Discord
              </Link>
            </div>
            <div className="bg-background">
              <TroubleshootingSection />
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade confirmation dialog */}
      <UpgradeConfirmationDialog
        open={upgradeConfirmation.open}
        onOpenChange={(open) =>
          setUpgradeConfirmation((prev) => ({ ...prev, open }))
        }
        currentPlanId={currentPlanId}
        upgradePlanId={upgradeConfirmation.planId}
        onConfirm={() => {
          setUpgradeConfirmation((prev) => ({ ...prev, open: false }))
          handleUpgradePlan(upgradeConfirmation.planId)
        }}
        isLoading={isUpgradeLoading}
      />
    </div>
  )
}
