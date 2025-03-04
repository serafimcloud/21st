"use client"

import { OnboardingServerWrapper } from "@/components/features/magic/onboarding/onboarding-server-wrapper"
import { ApiKey } from "@/types/global"
import { PlanInfo } from "@/app/settings/billing/page"
import { FAQ } from "@/components/features/magic/faq"
import { TroubleshootingSection } from "@/components/features/magic/troubleshooting"
import Link from "next/link"

interface GetStartedClientProps {
  initialApiKey: ApiKey | null
  userId: string | null
  subscription: PlanInfo | null
}

export function GetStartedClient({
  initialApiKey,
  userId,
  subscription,
}: GetStartedClientProps) {
  const usageCount = subscription?.usage || 0
  const usageLimit = subscription?.limit || 5
  const currentPlanId = subscription?.type || "free"

  return (
    <div className="min-h-screen w-full bg-background antialiased mt-14">
      <div className="p-3 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content (2/3 width on desktop) */}
          <div className="lg:col-span-2">
            <OnboardingServerWrapper
              initialApiKey={initialApiKey}
              userId={userId}
            />
          </div>

          {/* Right column (1/3 width on desktop) */}
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
                          strokeDashoffset={`${
                            2 * Math.PI * 8 * (1 - usageCount / usageLimit)
                          }`}
                        />
                      </svg>
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

            {/* FAQ */}
            <div className="space-y-2">
              <h3 className="font-medium pb-4 border-b mb-4">
                Frequently Asked Questions
              </h3>
              <div className="bg-background">
                <FAQ simplified={true} />
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="space-y-2 mt-8">
              <div className="flex items-center justify-between pb-4 border-b mb-4">
                <h3 className="font-medium">
                  Troubleshooting Guide
                </h3>
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
      </div>
    </div>
  )
}
