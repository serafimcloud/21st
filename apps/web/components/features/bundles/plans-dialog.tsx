"use client"

import { Spinner } from "@/components/icons/spinner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { formatPrice } from "@/lib/utils"
import { bundle_plans } from "@/prisma/client"
import { useClerk, useUser } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { Check } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { UserComponentsTab } from "../user-page/user-page-header"

interface PlansDialogProps {
  plans: bundle_plans[]
  initialOpen: boolean
  initialSelectedPlan: bundle_plans | null
  onClose?: () => void
  readonly?: boolean
}

export default function PlansDialog({
  plans,
  initialSelectedPlan,
  initialOpen,
  onClose,
  readonly = false,
}: PlansDialogProps) {
  const { user } = useUser()
  const [selectedPlan, setSelectedPlan] = useState(initialSelectedPlan)
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(initialOpen)
  const theme = useTheme()
  const { openSignUp } = useClerk()

  useEffect(() => {
    setOpen(initialOpen)
  }, [initialOpen])

  useEffect(() => {
    setSelectedPlan(initialSelectedPlan)
  }, [initialSelectedPlan])

  useEffect(() => {
    if (open === false) {
      onClose?.()
    }
  }, [open])

  if (plans.length === 0) {
    return null
  }

  const handlePlanSelected = (id: number) => {
    const plan = plans.find((p) => p.id === id)
    if (plan) {
      setSelectedPlan(plan)
    }
  }

  const redirectToCheckout = async (plan: bundle_plans) => {
    if (!user) {
      openSignUp({
        appearance: {
          baseTheme: theme.theme === "dark" ? dark : undefined,
        },
        redirectUrl: window.location.href,
      })
      return
    }

    if (!plans.some((p) => p.id === plan.id)) {
      toast.error("Plan not found")
      return
    }

    const returnUrl = `${window.location.origin}/${user.username}/?tab=${"purchased_bundles" as UserComponentsTab}`

    const response = await fetch("/api/stripe/create-checkout-bundle", {
      method: "POST",
      body: JSON.stringify({
        bundleId: plan.bundle_id,
        planId: plan.id,
        successUrl: returnUrl,
        cancelUrl: returnUrl,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      window.location.href = data.url
    } else {
      toast.error("Failed to create checkout for bundle")
    }
  }

  const onPlanConfirmed = async (plan: bundle_plans) => {
    setIsLoading(true)
    await redirectToCheckout(plan)
    setIsLoading(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (isLoading) {
      return
    }
    setOpen(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent hideCloseButton className="w-full sm:w-fit">
        <fieldset disabled={isLoading} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-left">Choose your plan</DialogTitle>
            <DialogDescription className="text-left">
              Select the perfect plan for your needs
            </DialogDescription>
          </DialogHeader>

          <RadioGroup
            disabled={readonly}
            className="flex flex-col gap-4 sm:flex-row overflow-auto"
            value={selectedPlan?.id?.toString() ?? undefined}
            onValueChange={(value) => handlePlanSelected(Number(value))}
          >
            {/* TODO: Craft */}
            {plans.map((plan) => {
              return (
                <label
                  key={plan.id}
                  className={`relative w-full sm:w-72 flex flex-col rounded-lg gap-3 border border-input p-4 shadow-sm transition-colors duration-50 has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent flex-shrink-0`}
                >
                  <RadioGroupItem
                    value={plan.id.toString()}
                    id={plan.id.toString()}
                    className="hidden"
                  />
                  <div className="flex items-center flex-col gap-2">
                    <div className="flex items-center w-full justify-between">
                      <h1 className="font-semibold capitalize">{plan.type}</h1>
                      <div className="flex items-baseline shrink-0">
                        <h1 className="font-semibold text-xl">
                          {formatPrice(plan.price / 100)}
                        </h1>
                        <span className="ml-1 text-xs text-muted-foreground">
                          for lifetime
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-y-scroll sm:max-h-[400px] flex flex-col gap-2">
                    {plan.description && (
                      <p className="text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    )}
                    {plan.features.length > 0 && (
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li
                            key={index}
                            className="flex gap-2 text-sm text-muted-foreground"
                          >
                            <Check
                              size={16}
                              strokeWidth={2}
                              className="mt-0.5 shrink-0 text-primary"
                              aria-hidden="true"
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </label>
              )
            })}
          </RadioGroup>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            {!readonly ? (
              <>
                <Button
                  type="button"
                  className="gap-2"
                  onClick={() => {
                    if (selectedPlan) {
                      onPlanConfirmed(selectedPlan)
                    }
                  }}
                >
                  {isLoading && <Spinner size={16} color="white" />}
                  Confirm Selection
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
              </>
            ) : (
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Close
                </Button>
              </DialogClose>
            )}
          </DialogFooter>
        </fieldset>
      </DialogContent>
    </Dialog>
  )
}
