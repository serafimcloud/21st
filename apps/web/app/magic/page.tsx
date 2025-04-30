import { Metadata } from "next"
import { MagicPageClient } from "./page.client"

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
  return <MagicPageClient />
}
