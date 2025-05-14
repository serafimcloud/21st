import { Metadata } from "next"
import { Header } from "@/components/ui/header.client"
import { Footer } from "@/components/ui/footer"
import { FounderPhotos } from "./founder-photos"
import { LinkPreview } from "@/components/ui/link-preview"

export const metadata: Metadata = {
  title: "Our Story - 21st.dev",
  description: "The story behind 21st.dev and how it all began",
}

export default function OurStoryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl py-6 px-4 sm:py-16 pt-20 sm:px-8">
          <div className="relative mb-16">
            {/* Notion-style page title with emoji */}
            <div className="pt-40 flex items-center gap-3">
              <h1 className="text-2xl sm:text-[36px] leading-tight font-bold space-y-10">
                Our Story
              </h1>
            </div>

            {/* Notion-style content layout */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
              {/* Main content */}
              <div className="flex-1 space-y-6">
                <div className="prose prose-quoteless prose-neutral dark:prose-invert">
                  <div className="text-2xl sm:text-[36px] leading-tight font-bold text-muted-foreground space-y-10">
                    <p>
                      I'm{" "}
                      <LinkPreview
                        url="https://x.com/serafimcloud"
                        isStatic={true}
                        imageSrc="https://pbs.twimg.com/profile_images/1916816781143851008/hzhOBldZ_400x400.jpg"
                        className="text-foreground font-bold"
                      >
                        Serafim
                      </LinkPreview>
                      , and I started{" "}
                      <span className="text-foreground">21st.dev</span> because
                      I'm a <span className="text-foreground">vibe coder</span>.
                    </p>

                    <p>
                      At first, I was just experimenting with frontend —
                      learning by building. One day, I made a small{" "}
                      <LinkPreview
                        url="https://x.com/shadcn"
                        isStatic={true}
                        imageSrc="https://pbs.twimg.com/profile_images/1593304942210478080/TUYae5z7_400x400.jpg"
                        className="text-foreground font-bold"
                      >
                        shadcn
                      </LinkPreview>
                      -style component I was proud of. I wanted to share it
                      somewhere… but realized there was{" "}
                      <span className="text-foreground">no great place</span> to
                      do that.
                    </p>

                    <p>
                      Around the same time, I stumbled upon amazing component
                      libraries like{" "}
                      <LinkPreview
                        url="https://magicui.design"
                        className="text-foreground font-bold"
                        isStatic={true}
                        imageSrc="https://vucvdpamtrjkzmubwlts.supabase.co/storage/v1/object/public/images//magicui.png"
                      >
                        Magic UI
                      </LinkPreview>
                      ,{" "}
                      <LinkPreview
                        url="https://aceternity.com"
                        className="text-foreground font-bold"
                      >
                        Aceternity
                      </LinkPreview>
                      , and{" "}
                      <LinkPreview
                        url="https://motion-primitives.com"
                        className="text-foreground font-bold"
                      >
                        Motion Primitives
                      </LinkPreview>
                      . They were beautiful — but scattered across different
                      sites, hard to find, and easy to miss. I thought:{" "}
                      <span className="text-foreground">
                        why isn't there one place where all of this lives?
                      </span>
                    </p>

                    <p>
                      That idea became the seed for{" "}
                      <span className="text-foreground">21st.dev</span>.
                    </p>

                    <p>
                      I started building the first version with{" "}
                      <LinkPreview
                        url="https://x.com/daniel_dhawan"
                        isStatic={true}
                        imageSrc="https://pbs.twimg.com/profile_images/1844332776725598224/piNWYXgo_400x400.jpg"
                        className="text-foreground font-bold"
                      >
                        Daniel Dhawan
                      </LinkPreview>{" "}
                      inside a project called{" "}
                      <LinkPreview
                        url="https://rork.com"
                        className="text-foreground font-bold"
                      >
                        Rork.com
                      </LinkPreview>{" "}
                      — an AI tool for building websites and apps. The vision
                      was to use{" "}
                      <span className="text-foreground">21st.dev</span> like a{" "}
                      <span className="text-foreground font-bold">
                        Figma Community
                      </span>{" "}
                      for code. But later,{" "}
                      <span className="text-foreground">Rork</span> pivoted to
                      focus on mobile apps, and{" "}
                      <span className="text-foreground">Daniel</span> spun it
                      off into a separate direction.
                    </p>

                    <p>
                      I decided to keep building{" "}
                      <span className="text-foreground">21st.dev</span>.
                    </p>

                    <p>
                      Soon after,{" "}
                      <LinkPreview
                        url="https://x.com/sergeybunas"
                        isStatic={true}
                        imageSrc="https://pbs.twimg.com/profile_images/1872342398057230336/hCUe084N_400x400.jpg"
                        className="text-foreground font-bold"
                        width={200}
                        height={200}
                      >
                        Sergey Bunas
                      </LinkPreview>{" "}
                      joined — and in just three days, he built{" "}
                      <LinkPreview
                        url="https://21st.dev/magic"
                        className="text-foreground font-bold"
                        isStatic={true}
                        imageSrc="https://21st.dev/magic-agent-og-image.png"
                        width={200}
                        height={120}
                      >
                        Magic MCP
                      </LinkPreview>
                      : our AI-powered component generator. You can install it
                      as an agent inside{" "}
                      <LinkPreview
                        url="https://cursor.com"
                        className="text-foreground font-bold"
                      >
                        Cursor
                      </LinkPreview>{" "}
                      or other AI IDEs. It quickly gained traction and became a
                      favorite among developers.
                    </p>

                    <p>
                      We were featured in an{" "}
                      <LinkPreview
                        url="https://a16z.com/a-deep-dive-into-mcp-and-the-future-of-ai-tooling/"
                        className="text-foreground font-bold"
                      >
                        a16z
                      </LinkPreview>{" "}
                      article about the future of AI-powered development. We
                      raised our first round of funding. And most importantly —
                      we kept building.
                    </p>

                    <p>
                      We're building{" "}
                      <span className="text-foreground">
                        the best way to create UI components
                      </span>{" "}
                      —
                      with <span className="text-foreground">
                        Magic MCP
                      </span>{" "}
                      for AI generation, and{" "}
                      <span className="text-foreground">21st.dev</span> as the
                      home to{" "}
                      <span className="text-foreground">
                        share, remix, and evolve
                      </span>{" "}
                      them.
                    </p>

                    <p>
                      For <span className="text-foreground">vibe coders</span>.
                      For{" "}
                      <span className="text-foreground">design engineers</span>.
                      <br />
                      For anyone shaping the web.
                    </p>

                    <p>And we're just getting started.</p>
                  </div>
                </div>
              </div>

              {/* Founder photos component */}
              <div className="lg:w-[350px] hidden lg:block lg:min-h-screen pt-40 ">
                <FounderPhotos />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
