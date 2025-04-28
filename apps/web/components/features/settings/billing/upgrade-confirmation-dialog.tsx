import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoaderCircle } from "lucide-react"
import { PLAN_LIMITS, PlanType } from "@/lib/config/subscription-plans"

interface UpgradeConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlanId: PlanType
  upgradePlanId: PlanType
  onConfirm: () => void
  isLoading: boolean
}

export function UpgradeConfirmationDialog({
  open,
  onOpenChange,
  currentPlanId,
  upgradePlanId,
  onConfirm,
  isLoading,
}: UpgradeConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Plan Upgrade</DialogTitle>
          <DialogDescription>
            {currentPlanId === "free" ? (
              <>
                You're about to upgrade to the{" "}
                {PLAN_LIMITS[upgradePlanId].displayName} plan. You will be
                charged ${PLAN_LIMITS[upgradePlanId].monthlyPrice} for the first
                month.
              </>
            ) : (
              <>
                You're about to upgrade from{" "}
                {PLAN_LIMITS[currentPlanId].displayName} to{" "}
                {PLAN_LIMITS[upgradePlanId].displayName}. This will update your
                existing subscription and you'll be charged the price difference
                for the current billing period.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <LoaderCircle className="mr-2 h-3 w-3 animate-spin" />
                Processing
              </>
            ) : (
              "Confirm Upgrade"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
