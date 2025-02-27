"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import NumberFlow from "@number-flow/react"
import { addToMagicWaitlist } from "@/lib/resend"

interface WaitlistGateProps {
  children: React.ReactNode
}

export function WaitlistGate({ children }: WaitlistGateProps) {
  const [hasAccess, setHasAccess] = useState(false)
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [count, setCount] = useState(1243)
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

  return <>{children}</>
}
