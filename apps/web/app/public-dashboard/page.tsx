import { Metadata } from "next"
import { PublicDashboardClient } from "./page.client"

export const metadata: Metadata = {
  title: "21st.dev - Public Payouts Dashboard",
  description: "View all authors receiving payouts in 21st.dev",
}

export default function PublicDashboardPage() {
  return <PublicDashboardClient />
}
