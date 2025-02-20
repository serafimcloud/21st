"use client"

import React, { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Link from "next/link"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Onboarding } from "@/components/features/magic/onboarding/onboarding-layout"
import { ApiKey } from "@/types/global"
import { MessageSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { motion } from "motion/react"
import { toast } from "sonner"
import { addToMagicWaitlist } from "@/lib/resend"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import NumberFlow from "@number-flow/react"

interface ConsolePageClientProps {
  initialApiKey: ApiKey | null
  userId: string | null
}

export function ConsolePageClient({
  initialApiKey,
  userId,
}: ConsolePageClientProps) {
  const [apiKey, setApiKey] = useState<ApiKey | null>(initialApiKey)
  const [hasAccess, setHasAccess] = useState(false)
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [count, setCount] = useState(1243)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    if (typeof window === "undefined") return true
    return !!localStorage.getItem("magic_onboarding_completed")
  })

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const encodedEmail = params.get("waitlist")

    if (!isMounted) return

    if (encodedEmail) {
      try {
        const email = atob(encodedEmail)
        if (isValidEmail(email)) {
          localStorage.setItem("waitlist_email", email)
          window.history.replaceState({}, "", "/magic/console")
        } else {
          toast.error("Invalid invite link")
          console.error("Invalid email format in waitlist parameter")
        }
      } catch (error) {
        console.error("Error decoding email:", error)
        toast.error("Invalid invite link")
      }
    }

    const hasWaitlistAccess = !!localStorage.getItem("waitlist_email")
    setHasAccess(hasWaitlistAccess)
  }, [isMounted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const time = new Date()
    const timestamp = time.valueOf()
    const previousTimestamp = localStorage.getItem("loops-form-timestamp")

    if (previousTimestamp && Number(previousTimestamp) + 60000 > timestamp) {
      toast.error("Too many signups, please try again in a little while")
      setIsLoading(false)
      return
    }

    localStorage.setItem("loops-form-timestamp", timestamp.toString())

    try {
      const { success, error } = await addToMagicWaitlist(email)

      if (success) {
        toast.success(
          "Thanks for joining the waitlist! We'll be in touch soon!",
        )
        setEmail("")
        setCount((prev) => prev + 1)
      } else {
        throw error
      }
    } catch (error) {
      if (error instanceof Error && error.message === "Failed to fetch") {
        toast.error("Too many signups, please try again in a little while")
        return
      }
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to join waitlist. Please try again.",
      )
      localStorage.setItem("loops-form-timestamp", "")
    } finally {
      setIsLoading(false)
    }
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleOnboardingComplete = () => {
    localStorage.setItem("magic_onboarding_completed", "true")
    setHasCompletedOnboarding(true)
  }

  if (!hasAccess) {
    return (
      <div className="relative min-h-screen bg-black/[0.96] antialiased bg-grid-purple/[0.02]">
        <div className="relative z-10">
          <section className="flex min-h-screen flex-col items-center justify-center px-4 pt-20 pb-10 lg:py-40">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl text-center text-4xl font-bold tracking-tight sm:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400"
            >
              Magic Agent Beta
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 max-w-2xl text-center text-xl leading-8 text-neutral-300"
            >
              Join the waitlist to get early access to Magic Agent and start
              building beautiful UI components with AI.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 w-full max-w-md"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="min-h-[48px] sm:!h-12 flex-1 bg-white/5 text-neutral-200 border-white/10"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={!isValidEmail(email) || isLoading}
                    className={cn(
                      "min-h-[48px] sm:h-12 whitespace-nowrap bg-white/10 px-6 text-neutral-200 hover:bg-white/20 backdrop-blur-sm border-none",
                      isLoading && "opacity-50",
                    )}
                  >
                    {isLoading ? "Joining..." : "Join Waitlist"}
                  </Button>
                </div>

                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      <Avatar className="h-8 w-8 border border-black">
                        <AvatarFallback className="bg-slate-900 text-sm font-medium text-neutral-200">
                          JD
                        </AvatarFallback>
                      </Avatar>
                      <Avatar className="h-8 w-8 border border-black">
                        <AvatarFallback className="bg-gray-900 text-sm font-medium text-neutral-200">
                          AS
                        </AvatarFallback>
                      </Avatar>
                      <Avatar className="h-8 w-8 border border-black">
                        <AvatarFallback className="bg-zinc-900 text-sm font-medium text-neutral-200">
                          MK
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="text-sm text-neutral-300">
                      <NumberFlow value={count} />+ people joined
                    </span>
                  </div>
                  <span className="text-sm text-neutral-300">
                    Queue: 1-2 days
                  </span>
                </div>
              </form>
            </motion.div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Header */}
      <header className="top-0 z-10 flex h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <Link
            href="/magic"
            className="flex items-center justify-center w-[22px] h-[22px] rounded-full bg-foreground hover:opacity-90 transition-opacity"
          />
          <div className="flex items-center gap-2">
            <Icons.slash className="text-border w-[22px] h-[22px] hidden sm:block" />
            <span className="text-[14px] font-medium hidden sm:inline-block">
              Magic
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link
            href="https://discord.gg/Qx4rFunHfm"
            target="_blank"
            className="gap-2 whitespace-nowrap"
          >
            <MessageSquare className="block sm:hidden h-4 w-4" />
            <span className="hidden sm:inline-block">Feedback</span>
          </Link>
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1">
        <Tabs defaultValue="onboarding" className="h-full">
          <div className="border-b overflow-x-auto">
            <TabsList className="h-auto gap-4 sm:gap-6 rounded-none bg-transparent px-2 sm:px-4 py-1 text-foreground flex-nowrap">
              <TabsTrigger
                value="onboarding"
                className="relative min-w-[80px] after:absolute after:inset-x-0 after:bottom-[-3px] after:-mb-px after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
              >
                Onboarding
              </TabsTrigger>
              <TabsTrigger
                value="usage"
                className="relative min-w-[60px] after:absolute after:inset-x-0 after:bottom-[-3px] after:-mb-px after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
              >
                Usage
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="relative min-w-[60px] after:absolute after:inset-x-0 after:bottom-[-3px] after:-mb-px after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
              >
                Billing
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="onboarding"
            className="h-full mt-0 border-0 p-3 sm:p-6"
          >
            <Onboarding
              apiKey={apiKey}
              setApiKey={setApiKey}
              userId={userId}
              showWelcome={!hasCompletedOnboarding}
              onWelcomeComplete={handleOnboardingComplete}
            />
          </TabsContent>

          <TabsContent
            value="usage"
            className="h-full mt-0 border-0 p-3 sm:p-6"
          >
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-center max-w-md px-4">
                <p className="text-base sm:text-lg font-medium">
                  Usage Statistics
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Track your Magic usage and performance metrics. Coming soon...
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="billing"
            className="h-full mt-0 border-0 p-3 sm:p-6"
          >
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-center max-w-md px-4">
                <p className="text-base sm:text-lg font-medium">
                  Billing Management
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Manage your subscription and billing details. Coming soon...
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="invites"
            className="h-full mt-0 border-0 p-3 sm:p-6"
          >
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-center max-w-md px-4">
                <p className="text-base sm:text-lg font-medium">Team Invites</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Invite team members to collaborate with Magic. Coming soon...
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
