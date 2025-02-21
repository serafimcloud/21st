"use client"

import * as React from "react"
import { useId } from "react"
import { CreditCard, Store } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"

interface CheckoutDialogProps {
  selectedPlan: string
  isYearly: boolean
  onCheckout: () => Promise<void>
}

export function CheckoutDialog({
  selectedPlan,
  isYearly,
  onCheckout,
}: CheckoutDialogProps) {
  const id = useId()
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onCheckout()
    } catch (error) {
      console.error("Checkout error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="mb-5 flex flex-col items-start gap-2">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            <Store className="h-5 w-5" />
          </div>
          <DialogHeader>
            <DialogTitle>Complete your purchase</DialogTitle>
            <DialogDescription>
              {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}{" "}
              Plan - {isYearly ? "Yearly" : "Monthly"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleCheckout} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${id}-name`}>Name on card</Label>
              <Input id={`${id}-name`} placeholder="John Smith" required />
            </div>

            <div className="space-y-2">
              <Label>Card details</Label>
              <div className="rounded-md border">
                <div className="relative">
                  <Input
                    placeholder="Card number"
                    className="border-0 rounded-b-none"
                    required
                  />
                  <div className="absolute right-3 top-2.5 text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex">
                  <Input
                    placeholder="MM/YY"
                    className="border-0 rounded-none border-t"
                    required
                  />
                  <Input
                    placeholder="CVC"
                    className="border-0 rounded-none border-t border-l"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : "Complete Purchase"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <a href="#" className="underline hover:no-underline">
            terms
          </a>{" "}
          and{" "}
          <a href="#" className="underline hover:no-underline">
            conditions
          </a>
          .
        </p>
      </DialogContent>
    </Dialog>
  )
}
