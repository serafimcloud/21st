import { Footer } from "@/components/ui/footer"
import { unstable_cache } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"

export const metadata = {
  title: "Creator Studio | 21st.dev - The NPM for Design Engineers",
  description: "Publish and manage your components on 21st.dev",
}

export default async function StudioPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <div className="container max-w-6xl mx-auto px-4 py-12 mt-16">
          <div className="flex flex-col items-center text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Welcome to the 21st.dev Creator Studio
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Publish your components to 21st.dev and reach thousands of
              developers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="flex flex-col items-center p-6 rounded-lg border bg-card text-card-foreground shadow">
              <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 text-primary mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Reach a Global Audience
              </h3>
              <p className="text-center text-muted-foreground">
                Your components will be discoverable by thousands of developers
                worldwide
              </p>
            </div>

            <div className="flex flex-col items-center p-6 rounded-lg border bg-card text-card-foreground shadow">
              <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 text-primary mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                AI-Enhanced Publishing
              </h3>
              <p className="text-center text-muted-foreground">
                Leverage our AI tools to optimize and enhance your components
              </p>
            </div>

            <div className="flex flex-col items-center p-6 rounded-lg border bg-card text-card-foreground shadow">
              <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 text-primary mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M12 6V2H8" />
                  <path d="M5 10H2v4" />
                  <path d="M2 17.5v.5h4" />
                  <path d="M15 2h-3" />
                  <path d="M22 8h-4" />
                  <path d="M22 14h-3" />
                  <path d="M18 18h4v4" />
                  <rect width="12" height="12" x="6" y="6" rx="2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Usage Analytics</h3>
              <p className="text-center text-muted-foreground">
                Track how your components are performing with detailed analytics
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center mb-16">
            <h2 className="text-3xl font-bold mb-8">How It Works</h2>
            <ol className="grid md:grid-cols-3 gap-8 w-full">
              <li className="flex flex-col items-center text-center p-6 rounded-lg border bg-card text-card-foreground shadow">
                <div className="rounded-full w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Create Your Component
                </h3>
                <p className="text-muted-foreground">
                  Build a high-quality React component using TypeScript and
                  Tailwind CSS
                </p>
              </li>
              <li className="flex flex-col items-center text-center p-6 rounded-lg border bg-card text-card-foreground shadow">
                <div className="rounded-full w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Publish to 21st.dev
                </h3>
                <p className="text-muted-foreground">
                  Use our simple publishing flow to submit your component with
                  proper documentation
                </p>
              </li>
              <li className="flex flex-col items-center text-center p-6 rounded-lg border bg-card text-card-foreground shadow">
                <div className="rounded-full w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Grow Your Audience
                </h3>
                <p className="text-muted-foreground">
                  Watch your components get discovered, used, and shared by the
                  community
                </p>
              </li>
            </ol>
          </div>

          <div className="flex justify-center">
            <Link
              href={`/studio/${userId}`}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
            >
              Go to Your Studio
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
