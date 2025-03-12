import { Metadata } from "next"
import { Hero } from "@/components/features/magic/hero"
import { HowItWorks } from "@/components/features/magic/how-it-works"
import { FAQ } from "@/components/features/magic/faq"
import { Footer } from "@/components/ui/footer"
import { SupportedEditors } from "@/components/features/magic/supported-editors"
import { Features } from "@/components/features/magic/features"
import { SignInButton, SignedOut, SignedIn } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
  title:
    "Magic - AI Agent for Your IDE That Creates Professional UI Components | 21st.dev",
  description:
    "Transform your IDE with our AI agent that understands Modern Component Patterns. Create production-ready UI components in seconds instead of hours. Built for developers who want beautiful, consistent, and maintainable React components.",
  keywords: [
    "Cursor IDE",
    "AI code editor",
    "GitHub Copilot alternative",
    "VSCode extension",
    "AI pair programming",
    "code completion",
    "web development",
    "UI components",
    "React components",
    "TypeScript",
    "Next.js",
    "developer tools",
    "AI coding assistant",
    "Windsurf",
    "code generation",
    "MCP",
    "modern component patterns",
  ],
  openGraph: {
    title:
      "Magic - AI Agent for Your IDE That Creates Professional UI Components | 21st.dev",
    description:
      "Transform your IDE with our AI agent that understands Modern Component Patterns. Create production-ready UI components in seconds instead of hours. Built for developers who want beautiful, consistent, and maintainable React components.",
    images: ["/magic-agent-og-image.png"],
    type: "website",
    siteName: "21st.dev",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Magic - AI Agent for Your IDE That Creates Professional UI Components | 21st.dev",
    description:
      "Transform your IDE with our AI agent that understands Modern Component Patterns. Create production-ready UI components in seconds instead of hours. Built for developers who want beautiful, consistent, and maintainable React components.",
    images: ["/magic-agent-og-image.png"],
  },
}

export default function MagicPage() {
  return (
    <div className="absolute inset-0 min-h-screen w-full overflow-auto bg-black">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="h-7 w-7 bg-white rounded-full" />
          <span className="text-white font-medium">
            Magic <span className="font-light text-gray-400">by 21st.dev</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="text-white text-[14px] hover:text-gray-300 hover:bg-accent/10"
          >
            <Link href="/pricing">Pricing</Link>
          </Button>
          <SignedIn>
            <Button asChild>
              <Link href="/magic/get-started">Get Started</Link>
            </Button>
          </SignedIn>
          <SignedOut>
            <SignInButton>
              <Button>Sign up</Button>
            </SignInButton>
          </SignedOut>
        </div>
      </header>
      <main className="relative w-full">
        <Hero />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SupportedEditors />
          <Features />
          <HowItWorks />
          <FAQ />
        </div>
        <Footer isOpenSource={false} />
      </main>
    </div>
  )
}
