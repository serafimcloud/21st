import { PayoutsSettingsClient } from "./page.client"
import { Metadata } from "next"
import { PayoutsHeader } from "@/components/features/settings/payouts/payouts-header"

export const metadata: Metadata = {
  title: "Payouts Settings",
}

export default function PayoutsSettingsPage() {
  return (
    <>
      <PayoutsHeader />
      <PayoutsSettingsClient />
    </>
  )
}
