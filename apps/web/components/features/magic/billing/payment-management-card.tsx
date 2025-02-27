"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

export function PaymentManagementCard() {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">
          Payment history and payment method management will be available soon.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" disabled className="w-full">
          Manage Payments
        </Button>
      </CardFooter>
    </Card>
  )
}
