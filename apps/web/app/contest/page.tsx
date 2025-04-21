import React from "react"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { Header } from "@/components/ui/header.client"
import { Footer } from "@/components/ui/footer"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function Page(): JSX.Element {
  return (
    <div className="min-h-screen">
      <div className="min-h-screen flex flex-col">
        <Logo className="z-50" />
        <Header />
        <div className="flex-1 my-[11vh] max-w-[800px] mx-auto w-full px-4">
          <div className="space-y-8 text-foreground">
            <h1 className="text-3xl font-bold tracking-tight">
              Contest Overview
            </h1>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                📌 Quick Summary
              </h2>
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

            <div className="h-px bg-border" />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
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
            </section>

            <div className="h-px bg-border" />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
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
            </section>

            <div className="h-px bg-border" />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                🏷️ Categories
              </h2>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  <span className="font-semibold">Marketing Components</span> –
                  hero banners, CTA strips, email blocks, landing layouts
                </li>
                <li>
                  <span className="font-semibold">UI Components</span> – tables,
                  dashboards, charts, complex form elements
                </li>
                <li>
                  <span className="font-semibold">Seasonal Category</span> –
                  rotates each week (see roadmap below)
                </li>
              </ol>
            </section>

            <div className="h-px bg-border" />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                💰 Awards & Budget ($5 000 / week)
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
                        Global Awards (3)
                      </TableCell>
                      <TableCell>🥇 $1 400 • 🥈 $800 • 🥉 $400</TableCell>
                      <TableCell>
                        Highest scores across <em className="italic">all</em>{" "}
                        categories
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Category Awards (9)
                      </TableCell>
                      <TableCell>
                        🥇 $400 • 🥈 $250 • 🥉 $150 per category
                      </TableCell>
                      <TableCell>
                        Three winners in{" "}
                        <span className="font-semibold">each</span> of the three
                        categories
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Total Weekly Payout
                      </TableCell>
                      <TableCell className="font-bold">$5 000</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground italic">
                Overlap allowed: the same component can take multiple prizes
                (e.g., Global 🥈 + UI 🥇).
              </p>
            </section>

            <div className="h-px bg-border" />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                🌱 Seasonal Category Roadmap (First 3 Weeks)
              </h2>
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Week</TableHead>
                      <TableHead>Dates (PT)</TableHead>
                      <TableHead>Theme</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">1</TableCell>
                      <TableCell>April 21 – April 28</TableCell>
                      <TableCell className="font-medium">
                        Hero Sections
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">2</TableCell>
                      <TableCell>April 28 – May 5</TableCell>
                      <TableCell className="font-medium">
                        AI Chat Widgets
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">3</TableCell>
                      <TableCell>May 5 – May 12</TableCell>
                      <TableCell className="font-medium">
                        Login / Auth Pages
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <p className="text-base">
                A new three-week roadmap will be announced on the Monday of Week
                3.
              </p>
            </section>

            <div className="h-px bg-border" />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                📊 How We Rank Components
              </h2>
              <p className="text-base leading-7">
                Both <span className="font-semibold">community voting</span> and{" "}
                <span className="font-semibold">real-world usage metrics</span>{" "}
                are combined into a single score to decide the leaderboard.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
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
