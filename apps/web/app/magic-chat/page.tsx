import { Metadata } from "next"
import { MagicChatPageClient } from "./page.client"

export const metadata: Metadata = {
  title: "Magic Chat - Create Standout Components with AI | 21st.dev",
  description:
    "Start with a prompt, iterate in chat, and draw inspiration from the best works of 21st.dev's top design engineers. Create standout UI components with AI-powered Magic Chat.",
  keywords: [
    "Magic Chat",
    "AI UI generation",
    "standout components",
    "UI components",
    "React components",
    "TypeScript",
    "Next.js",
    "21st.dev",
    "AI chat",
    "component generation",
    "design inspiration",
    "design engineers",
    "iterate in chat",
    "prompt-based design",
    "modern component patterns",
  ],
  openGraph: {
    title: "Magic Chat - Create Standout Components with AI | 21st.dev",
    description:
      "Start with a prompt, iterate in chat, and draw inspiration from the best works of 21st.dev's top design engineers. Create standout UI components with AI-powered Magic Chat.",
    images: ["/magic-chat-og.png"],
    type: "website",
    siteName: "21st.dev",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Magic Chat - Create Standout Components with AI | 21st.dev",
    description:
      "Start with a prompt, iterate in chat, and draw inspiration from the best works of 21st.dev's top design engineers. Create standout UI components with AI-powered Magic Chat.",
    images: ["/magic-chat-og.png"],
  },
}

export default function MagicChatPage() {
  return <MagicChatPageClient />
}
