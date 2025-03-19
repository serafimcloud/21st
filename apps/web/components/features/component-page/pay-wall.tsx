import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useHotkeys } from "react-hotkeys-hook"
import { Loader2 } from "lucide-react"
import { Component } from "@/types/global"
import { ComponentAccessState } from "@/hooks/use-component-access"
import { useAtom } from "jotai"
import { userStateAtom, componentAccessAtom } from "@/lib/store/user-store"
import { toast } from "sonner"
import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FeatureCards } from "@/components/features/component-page/feature-cards"
import { cn } from "@/lib/utils"
import { usePurchaseComponent } from "@/lib/queries"
import { useRouter } from "next/navigation"
import {
  trackAttribution,
  ATTRIBUTION_SOURCE,
  SOURCE_DETAIL,
} from "@/lib/attribution-tracking"
import { PlanType } from "@/lib/config/subscription-plans"

interface PayWallProps {
  accessState: ComponentAccessState
  component: Component
}

interface SubscriptionInfo {
  type: PlanType
  current_period_end?: string
}

export function PayWall({ accessState, component }: PayWallProps) {
  const [userState] = useAtom(userStateAtom)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const { isSignedIn } = useUser()

  const handleUpgradePlan = async (
    planId: string,
    period: "monthly" | "yearly" = "monthly",
  ) => {
    if (isProcessing) return

    // Track attribution before redirecting to pricing page
    trackAttribution(
      ATTRIBUTION_SOURCE.COMPONENT_LIBRARY,
      SOURCE_DETAIL.PREMIUM_COMPONENT_CTA,
    )

    if (!isSignedIn) {
      window.location.href = "/pricing"
      return
    }

    setIsProcessing(true)
    try {
      const pathname = window.location.pathname
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "csrf-token": (window as any).__NEXT_DATA__?.props?.csrfToken || "",
        },
        credentials: "include",
        body: JSON.stringify({
          planId,
          period,
          successUrl: `${window.location.origin}${pathname}?success=true`,
          cancelUrl: `${window.location.origin}${pathname}?canceled=true`,
          attributionSource: ATTRIBUTION_SOURCE.COMPONENT_LIBRARY,
          sourceDetail: SOURCE_DETAIL.PREMIUM_COMPONENT_CTA,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
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
      setIsProcessing(false)
    }
  }

  const handleUnlockComponent = async () => {
    setIsProcessing(true)
    // Mock unlock API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast.success("Component unlocked successfully!")
    setIsProcessing(false)
    setShowUnlockDialog(false)
    // Here you would typically update the component access state
  }

  useHotkeys(
    ["enter"],
    () => {
      // Only trigger if we're not in any dialog
      const isInAnyDialog = document.querySelector('[role="dialog"]') !== null
      if (accessState === "REQUIRES_UNLOCK" && !isInAnyDialog) {
        setShowUnlockDialog(true)
      }
    },
    { preventDefault: true },
  )

  useHotkeys(
    ["meta+enter", "ctrl+enter"],
    () => {
      // Check if we're in the unlock dialog
      const isInUnlockDialog =
        document.querySelector('[data-dialog-type="unlock-component"]') !== null

      if (accessState === "REQUIRES_SUBSCRIPTION") {
        handleUpgradePlan("pro")
      } else if (accessState === "REQUIRES_UNLOCK") {
        if (isInUnlockDialog) {
          handleUnlockComponent()
        } else if (!showUnlockDialog) {
          setShowUnlockDialog(true)
        }
      }
    },
    { preventDefault: true },
  )

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 pointer-events-none bg-grid-purple" />

      <div className="relative z-10 h-full w-full overflow-hidden rounded-sm flex flex-col items-center justify-between p-4 text-center">
        {accessState === "REQUIRES_SUBSCRIPTION" && (
          <SubscriptionPaywall
            isProcessing={isProcessing}
            onUpgrade={() => handleUpgradePlan("pro")}
          />
        )}

        {accessState === "REQUIRES_TOKENS" && userState.subscription && (
          <TokensLimitPaywall
            requiredTokens={component.price}
            subscription={userState.subscription}
            isProcessing={isProcessing}
            onUpgrade={() => handleUpgradePlan("pro_plus")}
          />
        )}

        {accessState === "REQUIRES_UNLOCK" && (
          <UnlockPaywall
            component={component}
            balance={userState.balance || 0}
            isProcessing={isProcessing}
            onUnlock={() => setShowUnlockDialog(true)}
            subscription={userState.subscription ?? undefined}
          />
        )}
      </div>

      <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <DialogContent className="p-4" data-dialog-type="unlock-component">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Unlock Component
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              You're about to unlock this component using your tokens.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Current Balance
              </span>
              <span className="text-sm font-medium">
                {userState.balance} tokens
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Component Price
              </span>
              <span className="text-sm font-medium text-destructive">
                -{component.price} tokens
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">
                  Remaining Balance
                </span>
                <span className="text-sm font-medium text-foreground">
                  {(userState.balance || 0) - component.price} tokens
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnlockDialog(false)}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnlockComponent}
              disabled={isProcessing}
              className={cn("text-sm gap-1.5", isProcessing ? "" : "pr-1.5")}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Unlock
                  <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-kbd leading-none opacity-100 flex">
                    <span className="text-[10px]">
                      {navigator?.platform?.toLowerCase()?.includes("mac")
                        ? "⌘"
                        : "Ctrl"}
                    </span>
                    <Icons.enter className="h-2.5 w-2.5" />
                  </kbd>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function getTokenPrice(
  planType?: PlanType,
  period: "monthly" | "yearly" = "monthly",
) {
  switch (planType) {
    case "pro_plus":
      return 30 / 200 // $0.15 per token
    case "pro":
      return 10 / 50 // $0.2 per token
    default:
      return 10 / 50 // Default to Pro plan price
  }
}

function UnlockPaywall({
  component,
  balance,
  subscription,
}: {
  component: Component
  balance: number
  isProcessing: boolean
  onUnlock: () => void
  subscription?: SubscriptionInfo
}) {
  const purchaseMutation = usePurchaseComponent()
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const [, setComponentAccess] = useAtom(componentAccessAtom)
  const [userState, setUserState] = useAtom(userStateAtom)
  const tokenPrice = getTokenPrice(subscription?.type, "monthly")

  const handleUnlockComponent = async () => {
    try {
      const result = await purchaseMutation.mutateAsync({
        componentId: component.id,
      })

      if (result.success) {
        // Update component access state
        setComponentAccess({
          componentId: component.id,
          accessState: "UNLOCKED",
        })

        // Update user balance
        if (userState.balance !== null) {
          setUserState((prev) => ({
            ...prev,
            balance:
              prev.balance !== null ? prev.balance - component.price : null,
          }))
        }

        toast.success("Component unlocked successfully!")
        setShowUnlockDialog(false)
      } else {
        switch (result.error.type) {
          case "INSUFFICIENT_TOKENS":
            toast.error("Not enough tokens available")
            break
          case "ALREADY_PURCHASED":
            toast.error("You have already purchased this component")
            break
          case "UNAUTHORIZED":
            toast.error("Please log in to unlock components")
            break
          default:
            toast.error(result.error.message)
        }
      }
    } catch (error) {
      toast.error("Failed to unlock component. Please try again.")
    }
  }

  useHotkeys(
    ["enter"],
    () => {
      // Only trigger if we're not in any dialog
      const isInAnyDialog = document.querySelector('[role="dialog"]') !== null
      if (!isInAnyDialog) {
        setShowUnlockDialog(true)
      }
    },
    { preventDefault: true },
  )

  useHotkeys(
    ["meta+enter", "ctrl+enter"],
    () => {
      // Check if we're in the unlock dialog
      const isInUnlockDialog =
        document.querySelector('[data-dialog-type="unlock-component"]') !== null

      if (isInUnlockDialog) {
        handleUnlockComponent()
      } else if (!showUnlockDialog) {
        setShowUnlockDialog(true)
      }
    },
    { preventDefault: true },
  )

  const features = [
    {
      title: "Full Source Code",
      description: "Access to the complete component code",
    },
    {
      title: "Lifetime Access",
      description: "Unlock once, use forever",
    },
    {
      title: "Updates Included",
      description: "Get all future improvements",
    },
  ]

  return (
    <div className="flex-1 w-full flex flex-col h-full gap-10">
      <div className="flex flex-col items-center justify-center flex-1 pt-20">
        <div className="space-y-2 mb-8">
          <h3 className="text-xl font-semibold">Premium Component</h3>
          <p className="text-muted-foreground">
            Unlock for {component.price} tokens ($
            {(component.price * tokenPrice).toFixed(2)}) to get full access
          </p>
        </div>

        <Button
          onClick={() => setShowUnlockDialog(true)}
          disabled={purchaseMutation.isPending}
          className={cn(
            "flex items-center justify-center gap-1.5",
            purchaseMutation.isPending ? "" : "pr-1.5",
          )}
        >
          {purchaseMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Unlock
              <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-kbd leading-none opacity-100 flex">
                <span className="text-[10px]">
                  {navigator?.platform?.toLowerCase()?.includes("mac")
                    ? "⌘"
                    : "Ctrl"}
                </span>
                <Icons.enter className="h-2.5 w-2.5" />
              </kbd>
            </>
          )}
        </Button>
      </div>

      <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <DialogContent className="p-4" data-dialog-type="unlock-component">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Unlock Component
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              You're about to unlock this component using your tokens.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Current Balance
              </span>
              <span className="text-sm font-medium">{balance} tokens</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Component Price
              </span>
              <span className="text-sm font-medium text-destructive">
                -{component.price} tokens
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">
                  Remaining Balance
                </span>
                <span className="text-sm font-medium text-foreground">
                  {balance - component.price} tokens
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnlockDialog(false)}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnlockComponent}
              disabled={purchaseMutation.isPending}
              className={cn(
                "text-sm gap-1.5",
                purchaseMutation.isPending ? "" : "pr-1.5",
              )}
            >
              {purchaseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Unlock
                  <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-kbd leading-none opacity-100 flex">
                    <span className="text-[10px]">
                      {navigator?.platform?.toLowerCase()?.includes("mac")
                        ? "⌘"
                        : "Ctrl"}
                    </span>
                    <Icons.enter className="h-2.5 w-2.5" />
                  </kbd>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FeatureCards title="What's included" features={features} />
    </div>
  )
}

const features = [
  {
    title: "Premium Components",
    description: "Access to premium components",
  },
  {
    title: "AI Component Generation",
    description: "Generate components with AI",
  },
  {
    title: "Priority Support",
    description: "Get help when you need it",
  },
]

function SubscriptionPaywall({
  isProcessing,
  onUpgrade,
}: {
  isProcessing: boolean
  onUpgrade: () => void
}) {
  const { isSignedIn } = useUser()
  const router = useRouter()

  const handleAction = () => {
    // Track attribution before upgrade
    trackAttribution(
      ATTRIBUTION_SOURCE.COMPONENT_LIBRARY,
      SOURCE_DETAIL.PREMIUM_COMPONENT_CTA,
    )
    if (!isSignedIn) {
      router.push("/pricing")
      return
    }
    onUpgrade()
  }

  return (
    <div className="flex-1 w-full flex flex-col h-full gap-10">
      <div className="flex flex-col items-center justify-center flex-1 pt-20">
        <div className="space-y-2 mb-8">
          <h3 className="text-xl font-semibold">Premium Component</h3>
          <p className="text-muted-foreground">
            {isSignedIn
              ? "Subscribe to access this premium component and many others. Get 50 tokens for $10/mo."
              : "Select a plan to access premium components. Starting at 50 tokens for $10/mo."}
          </p>
        </div>

        <Button
          onClick={handleAction}
          disabled={isProcessing}
          className={cn(
            "flex items-center justify-center gap-1.5",
            isProcessing || !isSignedIn ? "" : "pr-1.5",
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {isSignedIn ? "Subscribe Now" : "Select Plan"}
              {isSignedIn && (
                <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-kbd leading-none opacity-100 flex">
                  <span className="text-[11px] leading-none font-sans">
                    {navigator?.platform?.toLowerCase()?.includes("mac")
                      ? "⌘"
                      : "Ctrl"}
                  </span>
                  <Icons.enter className="h-2.5 w-2.5" />
                </kbd>
              )}
            </>
          )}
        </Button>
      </div>

      <FeatureCards title="What's included" features={features} />
    </div>
  )
}

function TokensLimitPaywall({
  requiredTokens,
  subscription,
  isProcessing,
  onUpgrade,
}: {
  requiredTokens: number
  subscription: SubscriptionInfo
  isProcessing: boolean
  onUpgrade: () => void
}) {
  const isPro = subscription?.type === "pro"
  const tokenPrice = getTokenPrice(subscription?.type, "monthly")

  const nextRefreshDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "next billing period"

  return (
    <div className="flex-1 w-full flex flex-col h-full gap-10">
      <div className="flex flex-col items-center justify-center flex-1 pt-20">
        <div className="space-y-2 mb-8 text-center">
          <h3 className="text-lg font-medium">Monthly Token Limit Reached</h3>
          <p className="text-sm text-muted-foreground">
            You need {requiredTokens} tokens ($
            {(requiredTokens * tokenPrice).toFixed(2)}) to unlock this
            component.
            <br />
            Your token balance will refresh on {nextRefreshDate}.
          </p>
          {isPro && (
            <div className="mt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">OR</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <p className="text-sm text-muted-foreground mb-4 px-4">
                Want higher monthly limits? Upgrade to Pro Plus plan
              </p>
              <div className="flex justify-center">
                <Button
                  onClick={onUpgrade}
                  disabled={isProcessing}
                  className={cn(
                    "flex items-center justify-center gap-1.5",
                    isProcessing ? "" : "pr-1.5",
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Upgrade to Pro Plus
                      <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-kbd leading-none opacity-100 flex">
                        <span className="text-[11px] leading-none font-sans">
                          {navigator?.platform?.toLowerCase()?.includes("mac")
                            ? "⌘"
                            : "Ctrl"}
                        </span>
                        <Icons.enter className="h-2.5 w-2.5" />
                      </kbd>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <FeatureCards title="What's included" features={features} />
    </div>
  )
}
