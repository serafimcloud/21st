import { Footer } from "@/components/ui/footer"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { supabaseWithAdminAccess } from "@/lib/supabase"

export const metadata = {
  title: "Creator Studio | 21st.dev - The NPM for Design Engineers",
  description:
    "Publish and manage your components on 21st.dev - reach thousands of developers and grow your audience",
}

export default async function StudioPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  // Get the user data from Supabase to determine username
  const { data: userData } = await supabaseWithAdminAccess
    .from("users")
    .select("display_username, username")
    .eq("id", userId)
    .single()

  // Construct the studio URL using the same logic as header.client.tsx
  const studioUrl = userData?.display_username
    ? `/studio/${userData.display_username}`
    : userData?.username
      ? `/studio/${userData.username}`
      : "/studio"

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 bg-gradient-to-b from-background to-muted/30">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="container max-w-6xl mx-auto px-4 pt-20 pb-16">
            <div className="flex flex-col items-center text-center mb-12">
              <div className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary px-3 py-1 text-sm mb-6">
                <span className="font-medium">Creator Studio</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--primary-gradient-start))] to-[hsl(var(--primary-gradient-end))]">
                Share Your Components
                <br />
                with the World
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mb-8">
                Join the community of design engineers and publish your UI
                components to 21st.dev
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href={studioUrl}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                >
                  Go to Your Studio
                </Link>
                <Link
                  href="/docs/publishing"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                >
                  Publishing Guide
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-16 max-w-4xl mx-auto">
              <div className="flex flex-col items-center p-4">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  5,000+
                </div>
                <div className="text-sm text-muted-foreground text-center">
                  Monthly Users
                </div>
              </div>
              <div className="flex flex-col items-center p-4">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  200+
                </div>
                <div className="text-sm text-muted-foreground text-center">
                  Components
                </div>
              </div>
              <div className="flex flex-col items-center p-4">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  50k+
                </div>
                <div className="text-sm text-muted-foreground text-center">
                  Monthly Downloads
                </div>
              </div>
              <div className="flex flex-col items-center p-4">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  100+
                </div>
                <div className="text-sm text-muted-foreground text-center">
                  Contributors
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 container max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Publish on 21st.dev?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">
                Recognition & Reputation
              </h3>
              <p className="text-muted-foreground mb-4">
                Build your reputation as a design engineer by sharing
                high-quality components with the community.
              </p>
            </div>

            <div className="flex flex-col rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m14 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 9" />
                  <path d="M15 13 9 7l4-4 6 6h3a8 8 0 0 1-7 7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">AI-Enhanced Visibility</h3>
              <p className="text-muted-foreground mb-4">
                Our AI-powered search and recommendation engine helps your
                components reach the right developers.
              </p>
            </div>

            <div className="flex flex-col rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Detailed Analytics</h3>
              <p className="text-muted-foreground mb-4">
                Track how your components are performing with detailed usage
                statistics and user feedback.
              </p>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-16 bg-muted/50">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">
              How It Works
            </h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
              Publishing your components to 21st.dev is simple and
              straightforward
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="relative flex flex-col items-center text-center p-6">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold mt-4 mb-2">
                  Create Your Component
                </h3>
                <p className="text-muted-foreground">
                  Build a high-quality React component using TypeScript and
                  Tailwind CSS
                </p>
              </div>
              <div className="relative flex flex-col items-center text-center p-6">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold mt-4 mb-2">
                  Publish to 21st.dev
                </h3>
                <p className="text-muted-foreground">
                  Use our simple publishing flow to submit your component with
                  proper documentation
                </p>
              </div>
              <div className="relative flex flex-col items-center text-center p-6">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold mt-4 mb-2">
                  Grow Your Audience
                </h3>
                <p className="text-muted-foreground">
                  Watch your components get discovered, used, and shared by the
                  community
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 container max-w-6xl mx-auto px-4">
          <div className="rounded-xl border bg-card p-8 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Ready to share your components?
                </h2>
                <p className="text-muted-foreground">
                  Start publishing your components and be part of the 21st.dev
                  community
                </p>
              </div>
              <Link
                href={studioUrl}
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                Go to Your Studio
              </Link>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  )
}
