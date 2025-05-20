"use client"

import PlansDialog from "@/components/features/bundles/plans-dialog"
import { HorizontalSlider } from "@/components/features/home/horizontal-slider"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { BundleExpanded } from "@/lib/api/bundles"
import { formatPrice } from "@/lib/utils"
import { transformDemoResult } from "@/lib/utils/transformData"
import {
  bundle_plan_type,
  bundle_plans,
  demos,
  payment_status,
  users,
} from "@/prisma/client"
import { useUser } from "@clerk/nextjs"
import { useEffect, useMemo, useState } from "react"

interface BundleSliderProps {
  user: users
  bundle: BundleExpanded
  hideStatus?: boolean
}

export function BundleItem({
  user,
  bundle,
  hideStatus = false,
}: BundleSliderProps) {
  const { user: clerkUser } = useUser()

  const sortedPlans = useMemo(
    () =>
      bundle.bundle_plans.toSorted((a, b) => {
        const typeOrder: Record<bundle_plan_type, number> = {
          individual: 0,
          team: 1,
          enterprise: 2,
        }
        const aOrder = typeOrder[a.type] ?? 3
        const bOrder = typeOrder[b.type] ?? 3
        return aOrder - bOrder
      }),
    [bundle.bundle_plans],
  )

  // Sort purchases in reversed chronological order (most recent first)
  const purchases = useMemo(() => {
    return bundle.bundle_purchases.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }, [bundle.bundle_purchases])

  const lastPurchase = useMemo(() => purchases[0], [purchases])
  const isAuthor = useMemo(
    () => clerkUser?.id === bundle.user_id,
    [clerkUser?.id, bundle.user_id],
  )
  const [showBuyDialog, setShowBuyDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<bundle_plans | null>(
    lastPurchase?.plan_id
      ? (sortedPlans.find((p) => p.id === lastPurchase.plan_id) ?? null)
      : (sortedPlans[0] ?? null),
  )

  useEffect(() => {
    if (isAuthor) {
      setSelectedPlan(null)
    }
  }, [isAuthor])

  const compIdToDemoMap = new Map<number, demos>()
  const allDemos = bundle.bundle_items.flatMap((item) => item.components.demos)
  for (const demo of allDemos) {
    if (!demo.component_id) continue
    const existing = compIdToDemoMap.get(demo.component_id)
    if (
      !existing ||
      (demo.created_at &&
        existing.created_at &&
        demo.created_at < existing.created_at)
    ) {
      compIdToDemoMap.set(demo.component_id, demo)
    }
  }
  const demosTransformed = Array.from(compIdToDemoMap.values()).map((demo) => {
    return transformDemoResult({
      ...demo,
      user_data: user,
      component_data: bundle.bundle_items.find(
        (item) => item.components.id === demo.component_id,
      )?.components,
      bundle_url: {
        html: demo.bundle_html_url,
      },
    })
  })

  const handlePlanButtonClick = (plan?: bundle_plans) => {
    if (plan) {
      setSelectedPlan(plan)
    }
    setShowBuyDialog(true)
  }

  // Status badge color class helper
  const mapStatusToClasses: Record<payment_status, string> = {
    pending: "!bg-muted text-muted-foreground",
    paid: "!bg-green-600 text-white",
    rejected: "!bg-destructive text-destructive-foreground",
    refunded: "!bg-gray-200 text-gray-700",
  }

  const mapStatusToLabel: Record<payment_status, string> = {
    pending: "Payment pending",
    paid: "Purchased",
    rejected: "Payment rejected",
    refunded: "Bundle refunded",
  }

  const readyToBuy =
    !isAuthor &&
    (!lastPurchase || !["pending", "paid"].includes(lastPurchase.status))

  return (
    <>
      <HorizontalSlider
        key={bundle.id}
        title={bundle.name}
        items={demosTransformed}
        hideUser={true}
        isLoading={false}
        totalCount={bundle.bundle_items.length}
        isLeaderboard={false}
        leftSide={
          <div className="flex items-center gap-2">
            {user.image_url && (
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.image_url} alt="Avatar" />
              </Avatar>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold leading-tight">{bundle.name}</h2>
                {!hideStatus && (
                  <>
                    {isAuthor && (
                      <Badge variant="outline" className="text-xs capitalize">
                        Your bundle
                      </Badge>
                    )}
                    {lastPurchase && (
                      <Tooltip key={lastPurchase.id}>
                        <TooltipTrigger asChild className="h-fit">
                          <Badge
                            className={`text-xs capitalize cursor-pointer ${mapStatusToClasses[lastPurchase.status]}`}
                          >
                            {mapStatusToLabel[lastPurchase.status]}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" showArrow>
                          {/* TODO: Craft a better tooltip */}
                          <div className="flex flex-col text-sm gap-1 min-w-[180px]">
                            <div className="font-semibold capitalize">
                              Purchase Info
                            </div>
                            {lastPurchase.price !== undefined && (
                              <div>
                                <span className="font-medium">Price:</span>{" "}
                                {formatPrice(lastPurchase.price / 100)}
                              </div>
                            )}
                            {lastPurchase.plan_id && sortedPlans.length > 0 && (
                              <div>
                                <span className="font-medium">Plan:</span>{" "}
                                {sortedPlans.find(
                                  (p) => p.id === lastPurchase.plan_id,
                                )?.type ?? "-"}
                              </div>
                            )}
                            {lastPurchase.created_at && (
                              <div>
                                <span className="font-medium">Date:</span>{" "}
                                {new Date(
                                  lastPurchase.created_at,
                                ).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </>
                )}
              </div>
              {user.name && (
                <div className="text-xs text-muted-foreground">
                  {`By ${user.name}`}
                </div>
              )}
            </div>
          </div>
        }
        rightSide={
          <div className="flex gap-2 items-center">
            {readyToBuy ? (
              sortedPlans.map((plan) => (
                <Button
                  key={plan.id}
                  className="capitalize"
                  onClick={() => handlePlanButtonClick(plan)}
                >
                  {plan.type} {formatPrice(plan.price / 100)}
                </Button>
              ))
            ) : (
              <Button variant="outline" onClick={() => handlePlanButtonClick()}>
                View plans
              </Button>
            )}
          </div>
        }
      />
      <PlansDialog
        plans={sortedPlans}
        initialOpen={showBuyDialog}
        onClose={() => setShowBuyDialog(false)}
        initialSelectedPlan={selectedPlan}
        readonly={!readyToBuy}
      />
    </>
  )
}
