import { Pricing } from "@/app/pricing/page.client"
import { Header } from "@/components/ui/header.client"
import { Footer } from "@/components/ui/footer"

export const metadata = {
  title: "Pricing - 21st.dev",
  description: "Choose the plan that best fits your needs",
}

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Pricing />
      </main>
      <Footer />
    </div>
  )
}
