"use client"

import { CreditCard } from "lucide-react"
import { Banner } from "@/components/ui/banner"
import { AllPlansTrigger } from "@/app/settings/billing/page.client"

export function BillingHeader() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-sm font-medium">Billing</h2>
          <p className="text-xs text-muted-foreground mt-1">
            For questions about billing,{" "}
            <a
              href="mailto:support@21st.dev"
              className="underline hover:text-primary"
            >
              contact us
            </a>
          </p>
        </div>
        <AllPlansTrigger />
      </div>
    </div>
  )
}
