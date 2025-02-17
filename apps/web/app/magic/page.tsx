import { Metadata } from "next"
import { Hero } from "@/components/features/magic/hero"
import { HowItWorks } from "@/components/features/magic/how-it-works"
import { Pricing } from "@/components/features/magic/pricing"
import { FAQ } from "@/components/features/magic/faq"

export const metadata: Metadata = {
  title: "Magic - The AI Agent That Builds Beautiful UI Components | 21st.dev",
  description:
    "Empower your IDE with an AI extension that creates stunning, production-ready components inspired by 21st.dev.",
}

export default function MagicPage() {
  return (
    <div className="absolute inset-0 min-h-screen w-full overflow-auto bg-black">
      <main className="relative w-full">
        <Hero />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <HowItWorks />
          <Pricing />
          <FAQ />
        </div>
      </main>
    </div>
  )
}
