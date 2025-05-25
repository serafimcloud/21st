import React, { Suspense } from "react"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { Footer } from "@/components/ui/footer"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trophy } from "lucide-react"
import { Header } from "@/components/ui/header.client"
import { supabaseWithAdminAccess } from "@/lib/supabase"

interface Round {
  id: number
  week_number: number
  start_at: string
  end_at: string
  seasonal_tag_id: number | null
  created_at: string
}

interface Tag {
  id: string
  name: string
}

async function getUpcomingRoundsWithTags(): Promise<{
  rounds: (Round & { seasonalTag: Tag | null })[]
}> {
  const now = new Date().toISOString()
  const { data: rounds } = await supabaseWithAdminAccess
    .from("component_hunt_rounds")
    .select("*")
    .gte("end_at", now)
    .order("start_at", { ascending: true })
    .limit(3)

  const roundsWithTags = await Promise.all(
    (rounds || []).map(async (round) => {
      let seasonalTag: Tag | null = null
      if (round.seasonal_tag_id) {
        const { data: tag } = await supabaseWithAdminAccess
          .from("tags")
          .select("id, name")
          .eq("id", round.seasonal_tag_id)
          .single()
        if (tag) {
          seasonalTag = { id: tag.id.toString(), name: tag.name }
        }
      }
      return { ...round, created_at: round.created_at ?? "", seasonalTag }
    }),
  )
  return { rounds: roundsWithTags }
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const startMonth = startDate.toLocaleString("en-US", { month: "long" })
  const endMonth = endDate.toLocaleString("en-US", { month: "long" })
  const startDay = startDate.getDate()
  const endDay = endDate.getDate()
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}`
  } else {
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}`
  }
}

export default async function Page() {
  const { rounds } = await getUpcomingRoundsWithTags()
  const safeRounds = rounds ?? []
  return (
    <div className="min-h-screen">
      <div className="min-h-screen flex flex-col">
        <Logo className="z-50" />
        <Header />
        <div className="flex-1 mt-[11vh] max-w-[640px] mx-auto w-full px-4">
          <div className="space-y-8 text-foreground p-3 sm:p-6 mb-[20vh]">
            <section className="space-y-4 w-full bg-background antialiased mt-14">
              <div className="flex justify-between items-center">
                <h2 className="font-medium flex items-center gap-2">
                  Contest
                </h2>
                <Button asChild className="gap-2">
                  <Link href="/contest/leaderboard">View Leaderboard</Link>
                </Button>
              </div>
              <p className="text-base leading-7">
                A fast-paced, week-long contest that rewards the best
                open-source components published on{" "}
                <span className="font-semibold">21st.dev</span>. Winners are
                chosen by a blend of{" "}
                <span className="font-semibold">direct community votes</span>{" "}
                and <span className="font-semibold">real-world usage data</span>{" "}
                collected during the week.
              </p>
            </section>
            {/* 
            <div className="h-px bg-border" />

            <section className="space-y-4">
              <h2 className="font-medium flex items-center gap-2">
                📜 Eligibility
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <span className="font-semibold">License:</span> Every
                  component submitted must be released under the{" "}
                  <span className="font-semibold">
                    21st.dev Community License
                  </span>
                  .
                </li>
                <li>
                  Components must be publicly available on 21st.dev before the
                  weekly submission window closes (see timeline below).
                </li>
              </ul>
            </section> */}

            <div className="h-px bg-border" />

            <section className="space-y-4">
              <h2 className="font-medium flex items-center gap-2">
                🗓️ Weekly Cycle
              </h2>
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Phase</TableHead>
                      <TableHead>What Happens</TableHead>
                      <TableHead>Pacific Time (PT)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Launch</TableCell>
                      <TableCell>
                        New round opens; you can submit components and start
                        voting
                      </TableCell>
                      <TableCell className="font-medium">
                        Monday 00:00 PT
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Upload & Vote
                      </TableCell>
                      <TableCell>
                        Publish components, gather votes & installs
                      </TableCell>
                      <TableCell>Mon 00:00 → Fri 23:59</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Voting-Only Window
                      </TableCell>
                      <TableCell>
                        Submissions close; voting & installs continue
                      </TableCell>
                      <TableCell className="font-medium">
                        Sat 00:00 → Sun 23:59
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Winners Announced
                      </TableCell>
                      <TableCell>Results posted; new round kicks off</TableCell>
                      <TableCell className="font-medium">
                        Monday 08:00 PT
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground italic">
                All counters reset at the start of each round.
              </p>
              <p className="text-sm text-muted-foreground italic">
                Note: From Monday to Friday, entries are shown in random order
                with hidden vote counts. Rankings become visible only on
                weekends (Saturday and Sunday).
              </p>
            </section>

            <div className="h-px bg-border" />

            <section className="space-y-4">
              <h2 className="font-medium flex items-center gap-2">
                🏷️ Categories
              </h2>
              <p className="text-base">
                <span className="font-semibold">1. Global Leaderboard</span> –
                All components compete for the top 10 positions.
              </p>
              <p className="text-base pt-2">
                <span className="font-semibold">2. Seasonal Category</span> –
                Rotating theme each week with bonus prizes (see roadmap below).
              </p>
            </section>

            <div className="h-px bg-border" />

            <section className="space-y-4">
              <h2 className="font-medium flex items-center gap-2">
                💰 Awards & Budget ($2 000 / week)
              </h2>
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Tier</TableHead>
                      <TableHead>Prize</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">
                        Global Awards (10)
                      </TableCell>
                      <TableCell>
                        🥇 $700 • 🥈 $400 • 🥉 $250 • 4th-10th $50 each
                      </TableCell>
                      <TableCell>
                        Top performers across all submissions
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Seasonal Awards (3)
                      </TableCell>
                      <TableCell>🥇 $150 • 🥈 $100 • 🥉 $50</TableCell>
                      <TableCell>
                        Best components in the weekly seasonal theme
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Total Weekly Payout
                      </TableCell>
                      <TableCell className="font-bold">$2 000</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground italic">
                Overlap allowed: the same component can take multiple prizes
                (e.g., Global 🥈 + Seasonal 🥇).
              </p>

              <div className="flex justify-center pt-2">
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/contest/leaderboard">
                    <Trophy className="h-4 w-4" />
                    View Current Leaderboard
                  </Link>
                </Button>
              </div>
            </section>

            

            <div className="h-px bg-border" />

            <section className="space-y-4">
              <h2 className="font-medium flex items-center gap-2">
                ⏸️ Planned Pause After Week 3
              </h2>
              <div className="rounded-lg border p-4 bg-muted/20">
                <p className="text-base leading-7">
                  After Week 3, we'll be taking a short pause to evaluate the
                  contest format and gather community feedback. During this
                  time, we'll be planning improvements and considering new
                  directions for future contests. Stay tuned for announcements
                  about the next phase of 21st.dev contests!
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Have ideas for how we should evolve the contests? Share your
                thoughts in our{" "}
                <a
                  href="https://discord.gg/Qx4rFunHfm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Discord community
                </a>
                .
              </p>
            </section>

            <div className="h-px bg-border" />

            <section className="space-y-4">
              <h2 className="font-medium flex items-center gap-2">
                📊 How We Rank Components
              </h2>
              <p className="text-base leading-7">
                Components are ranked primarily based on{" "}
                <span className="font-semibold">community voting</span>, with{" "}
                <span className="font-semibold">real-world usage</span>{" "}
                providing additional weight. In our current formula, one vote
                equals 10 installs.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="rounded-lg border p-4 text-center space-y-2">
                  <div className="font-medium text-xl">Votes</div>
                  <p className="text-sm text-muted-foreground">
                    Direct upvotes from community members
                  </p>
                </div>

                <div className="rounded-lg border p-4 text-center space-y-2">
                  <div className="font-medium text-xl">Installs</div>
                  <p className="text-sm text-muted-foreground">
                    Number of times a component has been downloaded
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4 bg-muted/20 mt-4">
                <p className="text-sm leading-6">
                  <span className="font-semibold">Fair Visibility Policy:</span>{" "}
                  To ensure all components get equal exposure regardless of
                  submission time, rankings and vote counts are hidden on
                  weekdays (Monday through Friday) and all submissions are
                  displayed in random order. Rankings and vote counts only
                  become visible on weekends (Saturday and Sunday), giving all
                  submissions equal opportunity for visibility.
                </p>
              </div>

              <div className="flex justify-center pt-4">
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/contest/leaderboard">
                    <Trophy className="h-4 w-4" />
                    See The Leaderboard
                  </Link>
                </Button>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-medium flex items-center gap-2">
                💬 Join the conversation
              </h2>
              <p className="text-base leading-7">
                Got questions or want instant feedback?{" "}
                <a
                  href="https://discord.gg/Qx4rFunHfm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Hop into our Discord
                </a>{" "}
                and connect with the rest of the 21st.dev community.
              </p>
            </section>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  )
}
