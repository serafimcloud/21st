"use client"

import { useState, useEffect } from "react"
import { PlanInfo } from "@/app/settings/billing/page"
import { TroubleshootingSection } from "@/components/features/magic/troubleshooting"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Check,
  LoaderCircle,
  Copy,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { PLAN_LIMITS, PlanType } from "@/lib/config/subscription-plans"
import { toast } from "sonner"
import { UpgradeConfirmationDialog } from "@/components/features/settings/billing/upgrade-confirmation-dialog"
import { CircleProgress } from "@/components/ui/circle-progress"
import { IdeOption, OsType } from "@/app/magic/onboarding/page.client"
import { Code } from "@/components/ui/code"
import { ApiKey } from "@/types/global"
import { useUser } from "@clerk/nextjs"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { cn } from "@/lib/utils"
import React from "react"
import { FeedbackDialog } from "@/components/features/magic/feedback-dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  trackAttribution,
  ATTRIBUTION_SOURCE,
  SOURCE_DETAIL,
} from "@/lib/attribution-tracking"
import { getInstallCommand, getMcpConfigJson } from "@/lib/config/magic-mcp"

interface ConsoleClientProps {
  subscription: PlanInfo | null
  apiKey: ApiKey | null
}

// Add the localStorage key constant
const ONBOARDING_STATE_KEY = "magic_onboarding_state"

type FeedbackType = "feedback" | "feature_request"

interface CheckboxCardProps extends React.HTMLAttributes<HTMLDivElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: string
  description?: string
  icon?: React.ReactNode
}

const CheckboxCard = React.forwardRef<HTMLDivElement, CheckboxCardProps>(
  (
    {
      className,
      checked = false,
      onCheckedChange,
      label,
      description,
      icon,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex cursor-pointer items-start gap-4 rounded-md border border-border p-4 transition-all duration-200",
          "hover:border-primary/50 hover:bg-muted/50",
          checked && "border-primary bg-primary/5",
          className,
        )}
        onClick={() => onCheckedChange?.(!checked)}
        {...props}
      >
        <div className="flex-shrink-0 pt-0.5">
          <div
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-md border border-border bg-background transition-all duration-200",
              checked && "border-primary bg-primary text-primary-foreground",
              !checked && "group-hover:border-primary/50",
            )}
          >
            {checked && <Check className="h-3.5 w-3.5" />}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {icon}
            <div className="text-sm font-medium text-foreground">{label}</div>
          </div>
          {description && (
            <div className="mt-1 text-xs text-muted-foreground">
              {description}
            </div>
          )}
        </div>
      </div>
    )
  },
)
CheckboxCard.displayName = "CheckboxCard"

export function ConsoleClient({
  subscription: initialSubscription,
  apiKey: initialApiKey,
}: ConsoleClientProps) {
  const { user } = useUser()
  const supabase = useClerkSupabaseClient()
  const [subscription, setSubscription] = useState<PlanInfo | null>(
    initialSubscription,
  )
  const [apiKey, setApiKey] = useState<ApiKey | null>(initialApiKey)
  const usageCount = subscription?.usage || 0
  const usageLimit = subscription?.limit || 5
  const currentPlanId = subscription?.type || "free"

  const [isUpgradeLoading, setIsUpgradeLoading] = useState(false)
  const [upgradeConfirmation, setUpgradeConfirmation] = useState<{
    open: boolean
    planId: PlanType
  }>({
    open: false,
    planId: "pro",
  })

  // Add state for the selected IDE
  const [selectedIde, setSelectedIde] = useState<IdeOption>("cursor")

  // Get OS type
  const [osType, setOsType] = useState<OsType>("mac")

  // Get the selected IDE and OS from localStorage on mount
  useEffect(() => {
    try {
      // Detect OS
      const userAgent = window.navigator.userAgent.toLowerCase()
      let detectedOs: OsType = "mac"

      if (userAgent.includes("windows")) {
        detectedOs = "windows"
      } else if (userAgent.includes("linux")) {
        detectedOs = "linux"
      }

      setOsType(detectedOs)

      console.log("Reading onboarding state from localStorage")
      const savedState = localStorage.getItem(ONBOARDING_STATE_KEY)
      console.log("Raw savedState:", savedState)

      if (savedState) {
        const parsedState = JSON.parse(savedState)
        console.log("Parsed state:", parsedState)

        if (
          parsedState &&
          typeof parsedState === "object" &&
          parsedState.selectedIde
        ) {
          console.log(
            "Found selectedIde in localStorage:",
            parsedState.selectedIde,
          )
          setSelectedIde(parsedState.selectedIde)
        } else {
          console.log("No valid selectedIde found in parsed state")
        }
      } else {
        console.log("No savedState found in localStorage")
      }
    } catch (error) {
      console.error("Error reading onboarding state:", error)
    }
  }, [])

  // Determine which plan to show as upgrade
  let upgradePlanId: PlanType | null = null
  if (currentPlanId === "free") {
    upgradePlanId = "pro"
  } else if (currentPlanId === "pro") {
    upgradePlanId = "pro_plus"
  }

  const handleUpgradePlan = async (
    planId: PlanType,
    period: "monthly" | "yearly" = "monthly",
  ) => {
    // Track attribution when upgrading plan from Magic console
    trackAttribution(ATTRIBUTION_SOURCE.MAGIC, SOURCE_DETAIL.MAGIC_CONSOLE)

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
          attributionSource: ATTRIBUTION_SOURCE.MAGIC,
          sourceDetail: SOURCE_DETAIL.MAGIC_CONSOLE,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create checkout session")
      }

      const data = await response.json()

      if (data.directly_upgraded) {
        const planOrder = { pro_plus: 3, pro: 2, free: 1 }
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
    // Track attribution when clicking upgrade button in Magic console
    trackAttribution(ATTRIBUTION_SOURCE.MAGIC, SOURCE_DETAIL.MAGIC_CONSOLE)

    setUpgradeConfirmation({
      open: true,
      planId,
    })
  }

  // Function to get the IDE installation command
  const command = apiKey
    ? getInstallCommand(selectedIde, apiKey.key, osType)
    : ""

  // Function to mask API key with dots
  const getMaskedApiKey = (key: string) => {
    return key
      .split("")
      .map(() => "•")
      .join("")
  }

  // Function to create API key
  const [isCreatingApiKey, setIsCreatingApiKey] = useState(false)
  const createApiKey = async () => {
    if (!user?.id) {
      toast.error("You must be signed in to generate an API key")
      return
    }

    setIsCreatingApiKey(true)
    try {
      const { data, error } = await supabase.rpc("create_api_key", {
        user_id: user.id,
        plan: "free",
        requests_limit: 100,
      })

      if (error) {
        console.error("Failed to create API key:", error)
        toast.error(`Failed to create API key: ${error.message}`)
        return
      }

      if (!data || !data.key) {
        toast.error("No API key data returned")
        return
      }

      const newKey: ApiKey = {
        id: data.id,
        key: data.key,
        user_id: data.user_id,
        plan: data.plan || "free",
        requests_limit: data.requests_limit || 100,
        requests_count: data.requests_count || 0,
        created_at: data.created_at || new Date().toISOString(),
        expires_at: data.expires_at,
        last_used_at: data.last_used_at,
        is_active: data.is_active ?? true,
        project_url: "https://21st.dev/magic",
      }

      setApiKey(newKey)
      toast.success("API key created successfully")
    } catch (error) {
      console.error("Error creating API key:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to create API key",
      )
    } finally {
      setIsCreatingApiKey(false)
    }
  }

  // State for copy confirmations
  const [copiedCommand, setCopiedCommand] = useState(false)
  const [copiedApiKey, setCopiedApiKey] = useState(false)
  const [copiedConfig, setCopiedConfig] = useState(false)

  // Update function to handle copy with confirmations
  const handleCopy = () => {
    if (!apiKey) return
    try {
      const textArea = document.createElement("textarea")
      textArea.value = command
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopiedCommand(true)
      toast.success("Command copied to clipboard")
      setTimeout(() => setCopiedCommand(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
      toast.error("Failed to copy command")
    }
  }

  // Function to copy API key
  const handleCopyApiKey = () => {
    if (!apiKey) return
    try {
      const textArea = document.createElement("textarea")
      textArea.value = apiKey.key
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopiedApiKey(true)
      toast.success("API key copied to clipboard")
      setTimeout(() => setCopiedApiKey(false), 2000)
    } catch (err) {
      console.error("Failed to copy API key:", err)
      toast.error("Failed to copy API key")
    }
  }

  // Function to copy config
  const handleCopyConfig = () => {
    if (!apiKey) return
    try {
      const config = getMcpConfigJson(apiKey.key, osType)
      const textArea = document.createElement("textarea")
      textArea.value = config
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopiedConfig(true)
      toast.success("Configuration copied to clipboard")
      setTimeout(() => setCopiedConfig(false), 2000)
    } catch (err) {
      console.error("Failed to copy config:", err)
      toast.error("Failed to copy configuration")
    }
  }

  // Add state for feedback dialog
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("feedback")

  return (
    <div className="min-h-screen w-full bg-background antialiased mt-14">
      <div className="p-3 sm:p-6">
        <div className="space-y-6">
          {/* Feedback section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-medium">Help Us Improve</h3>
            </div>
            <div className="bg-background rounded-lg border border-border overflow-hidden">
              <div className="p-4">
                <p className="text-sm text-muted-foreground">
                  We're constantly working to improve Magic MCP. Share your
                  thoughts or request new features to help us make it even
                  better.
                </p>
              </div>
              <div className="bg-muted p-3 rounded-b-lg flex justify-end gap-3 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFeedbackType("feedback")
                    setFeedbackDialogOpen(true)
                  }}
                >
                  Share Feedback
                </Button>
                <Button
                  onClick={() => {
                    setFeedbackType("feature_request")
                    setFeedbackDialogOpen(true)
                  }}
                >
                  Request Feature
                </Button>
              </div>
            </div>
          </div>

          {/* Current plan block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-medium">Current Plan</h3>
              <Link
                href="/settings/billing"
                className="text-muted-foreground hover:text-primary text-sm"
              >
                Manage subscription
              </Link>
            </div>
            <div className="bg-background rounded-lg border border-border overflow-hidden">
              <div className="p-4 flex flex-col md:flex-row md:justify-between gap-4 md:gap-0">
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
                        : subscription?.type === "pro"
                          ? "For professional developers"
                          : "For power users"}
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
                      ${upgradePlanId === "pro" ? "20" : "40"} per month
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

          {/* Install Command Section */}
          <div className="space-y-2 mt-8">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-medium">Install Magic MCP</h3>
            </div>
            <div className="bg-background rounded-lg border border-border overflow-hidden">
              <div className="p-4">
                <p className="text-sm text-muted-foreground">
                  Configure Magic MCP in your IDE by completing the guided
                  onboarding process.
                </p>
              </div>
              <div className="bg-muted p-3 rounded-b-lg flex justify-end gap-3 border-t">
                <Button asChild>
                  <Link href="/magic/onboarding?step=select-ide">
                    Setup Magic MCP
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="space-y-2 mt-8">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
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
              <TroubleshootingSection selectedIde={selectedIde} />
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={feedbackDialogOpen}
        onOpenChange={setFeedbackDialogOpen}
        initialType={feedbackType}
      />

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
