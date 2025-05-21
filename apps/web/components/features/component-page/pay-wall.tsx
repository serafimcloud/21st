import { FeatureCards } from "@/components/features/component-page/feature-cards"
import { Icons } from "@/components/icons"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { ComponentAccessState } from "@/hooks/use-component-access"
import { getComponentBundlesAction } from "@/lib/api/components"
import {
  ATTRIBUTION_SOURCE,
  SOURCE_DETAIL,
  trackAttribution,
} from "@/lib/attribution-tracking"
import { PlanType } from "@/lib/config/subscription-plans"
import { usePurchaseComponent } from "@/lib/queries"
import { componentAccessAtom, userStateAtom } from "@/lib/store/user-store"
import { cn, formatPrice } from "@/lib/utils"
import { Component } from "@/types/global"
import { useUser } from "@clerk/nextjs"
import { AvatarImage } from "@radix-ui/react-avatar"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { toast } from "sonner"
import PlansDialog from "../bundles/plans-dialog"

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

  let paywall = (
    <div className="my-auto">
      <LoadingSpinner />
    </div>
  )
  if (accessState === "REQUIRES_SUBSCRIPTION") {
    paywall = (
      <SubscriptionPaywall
        isProcessing={isProcessing}
        onUpgrade={() => handleUpgradePlan("pro")}
      />
    )
  } else if (accessState === "REQUIRES_UNLOCK") {
    paywall = (
      <UnlockPaywall
        component={component}
        balance={userState.balance || 0}
        isProcessing={isProcessing}
        onUnlock={() => setShowUnlockDialog(true)}
        subscription={userState.subscription ?? undefined}
      />
    )
  } else if (accessState === "REQUIRES_BUNDLE") {
    paywall = <BundlePaywall accessState={accessState} component={component} />
  } else if (accessState === "LOCKED") {
    paywall = <div className="my-auto">Component is unavailable</div>
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 pointer-events-none bg-grid-purple" />

      <div className="relative z-10 h-full w-full overflow-hidden rounded-sm flex flex-col items-center justify-between p-4 text-center">
        {paywall}
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
                {userState.balance ?? 0} tokens
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Component Price
              </span>
              <span className="text-sm font-medium text-destructive">
                -{0} tokens
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">
                  Remaining Balance
                </span>
                <span className="text-sm font-medium text-foreground">
                  {(userState.balance || 0) - 0} tokens
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
            balance: prev.balance !== null ? prev.balance - 0 : null,
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
            Unlock for {0} tokens ($
            {(0 * tokenPrice).toFixed(2)}) to get full access
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
                -{0} tokens
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">
                  Remaining Balance
                </span>
                <span className="text-sm font-medium text-foreground">
                  {balance - 0} tokens
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

function BundlePaywall({ accessState, component }: PayWallProps) {
  const [selectedBundleId, setSelectedBundleId] = useState<number | null>(null)

  const { data: bundles, isLoading } = useQuery({
    queryKey: ["bundles"],
    queryFn: () => {
      return getComponentBundlesAction({ componentId: component.id })
    },
  })

  type Bundle = Awaited<ReturnType<typeof getComponentBundlesAction>>[number]

  const handleBundleClick = (bundle: Bundle) => {
    setSelectedBundleId(bundle.id)
  }

  return (
    <>
      <div className="flex flex-col gap-4 h-full w-full items-center justify-center p-8">
        <div className="space-y-1 text-center">
          <h3 className="text-xl font-semibold">Bundle Component</h3>
          <p className="text-muted-foreground">
            To access this component, you need to purchase one of the bundles
          </p>
        </div>
        <div className="flex flex-col gap-2 items-center">
          {isLoading ? (
            <Skeleton className="h-8 w-32 rounded-full bg-muted-foreground/20" />
          ) : (
            bundles?.map((bundle) => {
              const smallestPrice = bundle.bundle_plans.sort(
                (a, b) => a.price - b.price,
              )[0]?.price
              return (
                <>
                  <Button
                    key={bundle.id}
                    variant="outline"
                    onClick={() => handleBundleClick(bundle)}
                    className="gap-2 rounded-full w-fit"
                  >
                    <Avatar className="w-4 h-4">
                      <AvatarImage
                        src={
                          bundle.users.image_url ??
                          bundle.users.display_image_url ??
                          ""
                        }
                      ></AvatarImage>
                      <AvatarFallback>
                        {bundle.users.name?.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {bundle.name}
                    {smallestPrice && (
                      <span className="text-sm text-muted-foreground">
                        from {formatPrice(smallestPrice / 100)}
                      </span>
                    )}
                  </Button>
                  <PlansDialog
                    plans={bundle.bundle_plans}
                    onClose={() => setSelectedBundleId(null)}
                    initialOpen={selectedBundleId === bundle.id}
                    initialSelectedPlan={null}
                  />
                </>
              )
            })
          )}
        </div>
        <Link
          href={`${process.env.NEXT_PUBLIC_APP_URL}/?tab=bundles`}
          className="underline"
        >
          View bundles
        </Link>
      </div>
    </>
  )
}
