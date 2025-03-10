import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useRouter } from "next/navigation"
import { useHotkeys } from "react-hotkeys-hook"
import { Check, Loader2 } from "lucide-react"
import { Component } from "@/types/global"
import { ComponentAccessState } from "@/hooks/use-component-access"
import { atomWithStorage } from "jotai/utils"
import { useAtom } from "jotai"
import { userStateAtom } from "@/lib/store/user-store"
import type { PrimitiveAtom } from "jotai/vanilla"
import { toast } from "sonner"
import { usePathname } from "next/navigation"
import { useState } from "react"

// Атом для дебага состояний
export const debugAccessStateAtom: PrimitiveAtom<ComponentAccessState | null> =
  atomWithStorage<ComponentAccessState | null>("debug_access_state", null)

// Атом для дебага баланса
export const debugBalanceAtom: PrimitiveAtom<number | null> = atomWithStorage<
  number | null
>("debug_balance", null)

interface PayWallProps {
  accessState: ComponentAccessState
  component: Component
}

export function PayWall({ accessState, component }: PayWallProps) {
  const router = useRouter()
  const [, setDebugState] = useAtom(debugAccessStateAtom)
  const [userState] = useAtom(userStateAtom)
  const [isProcessing, setIsProcessing] = useState(false)

  // Добавим дебаг-панель если включен режим разработки
  const showDebugPanel = process.env.NODE_ENV === "development"

  const handleUpgradePlan = async (
    planId: string,
    period: "monthly" | "yearly" = "monthly",
  ) => {
    if (isProcessing) return

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

  useHotkeys(
    ["meta+enter", "ctrl+enter"],
    () => {
      if (accessState === "REQUIRES_SUBSCRIPTION") {
        handleUpgradePlan("pro")
      }
    },
    { preventDefault: true },
  )

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 pointer-events-none bg-grid-purple" />

      {showDebugPanel && (
        <div className="absolute top-2 right-2 z-50 bg-background/80 backdrop-blur-sm p-2 rounded-lg border">
          <select
            value={accessState}
            onChange={(e) =>
              setDebugState(e.target.value as ComponentAccessState)
            }
            className="text-sm p-1 rounded border bg-background"
          >
            <option value="ACCESSIBLE">Accessible</option>
            <option value="REQUIRES_SUBSCRIPTION">Needs Subscription</option>
            <option value="REQUIRES_TOKENS">Needs Tokens</option>
          </select>
        </div>
      )}

      <div className="relative z-10 h-full w-full overflow-hidden rounded-sm flex flex-col items-center justify-between p-4 text-center">
        {accessState === "REQUIRES_SUBSCRIPTION" && (
          <SubscriptionPaywall
            isProcessing={isProcessing}
            onUpgrade={() => handleUpgradePlan("pro")}
          />
        )}

        {accessState === "REQUIRES_TOKENS" && (
          <TokensLimitPaywall
            requiredTokens={component.price}
            subscription={userState.subscription}
            isProcessing={isProcessing}
            onUpgrade={() => handleUpgradePlan("pro_plus")}
          />
        )}
      </div>
    </div>
  )
}

function SubscriptionPaywall({
  isProcessing,
  onUpgrade,
}: {
  isProcessing: boolean
  onUpgrade: () => void
}) {
  return (
    <div className="flex-1 w-full flex flex-col h-full">
      <div className="flex flex-col items-center justify-center flex-1 pt-20">
        <div className="space-y-2 mb-8">
          <h3 className="text-xl font-semibold">Premium Component</h3>
          <p className="text-muted-foreground">
            Subscribe to access this premium component and many others.
          </p>
        </div>

        <Button
          onClick={onUpgrade}
          disabled={isProcessing}
          className="flex items-center justify-center gap-1.5 pr-1.5"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Subscribe Now
              <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-muted leading-none opacity-100 flex">
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

      <div className="w-full border rounded-lg p-6 mt-auto text-start">
        <h4 className="text-sm font-medium mb-6">What's included</h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">Premium Components</span>
              <span className="text-xs text-muted-foreground">
                Up to 10 components per month
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">AI Component Generation</span>
              <span className="text-xs text-muted-foreground">
                Up to 50 generations per month
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">Priority Support</span>
              <span className="text-xs text-muted-foreground">
                Get help when you need it
              </span>
            </div>
          </div>
        </div>
      </div>
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
  subscription: any
  isProcessing: boolean
  onUpgrade: () => void
}) {
  const isPro = subscription?.type === "pro"

  // Calculate next token refresh date based on subscription period end
  const nextRefreshDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "next billing period"

  return (
    <div className="flex-1 w-full flex flex-col h-full">
      <div className="flex flex-col items-center justify-center flex-1 pt-20">
        <div className="space-y-2 mb-8 text-center">
          <h3 className="text-lg font-medium">Monthly Token Limit Reached</h3>
          <p className="text-sm text-muted-foreground">
            You need {requiredTokens} tokens to unlock this component.
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
                  className="flex items-center justify-center gap-1.5 pr-1.5"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Upgrade to Pro Plus
                      <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-muted leading-none opacity-100 flex">
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

      <div className="w-full border rounded-lg p-6 mt-auto text-start">
        <h4 className="text-sm font-medium mb-6">
          What's included in your plan
        </h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">Premium Components</span>
              <span className="text-xs text-muted-foreground">
                Up to 10 components per month
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">AI Component Generation</span>
              <span className="text-xs text-muted-foreground">
                Up to 50 generations per month
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">Priority Support</span>
              <span className="text-xs text-muted-foreground">
                Get help when you need it
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
