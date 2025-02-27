import { BillingLayout } from "@/components/features/magic/billing/billing-layout"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Billing | Subscription Management",
  description: "Manage your subscription and billing information",
}

export default async function BillingPage() {
  return <BillingLayout />
}
