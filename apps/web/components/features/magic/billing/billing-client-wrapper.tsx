"use client"

import { useState } from "react"
import { CurrentPlanCard } from "./current-plan-card"
import { PlanSelectorDialog } from "./plan-selector-dialog"

interface PlanInfo {
  name: string
  type: "free" | "standard" | "pro"
  period?: string | null
  periodEnd?: string | null
}

interface BillingClientWrapperProps {
  userId: string | null
  currentPlan: PlanInfo
}

export function BillingClientWrapper({
  userId,
  currentPlan,
}: BillingClientWrapperProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <CurrentPlanCard
        currentPlan={currentPlan}
        onManagePlan={() => setIsDialogOpen(true)}
      />

      <PlanSelectorDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        userId={userId}
      />
    </>
  )
}
