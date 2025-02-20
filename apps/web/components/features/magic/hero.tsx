"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import NumberFlow from "@number-flow/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Mockup, MockupFrame } from "@/components/ui/mockup"
import Image from "next/image"
import Link from "next/link"
import { addToMagicWaitlist } from "@/lib/resend"

type SpotlightProps = {
  gradientFirst?: string
  gradientSecond?: string
  gradientThird?: string
  translateY?: number
  width?: number
  height?: number
  smallWidth?: number
  duration?: number
  xOffset?: number
}

const Spotlight = ({
  gradientFirst = "radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(210, 100%, 85%, .08) 0, hsla(210, 100%, 55%, .02) 50%, hsla(210, 100%, 45%, 0) 80%)",
  gradientSecond = "radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .06) 0, hsla(210, 100%, 55%, .02) 80%, transparent 100%)",
  gradientThird = "radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .04) 0, hsla(210, 100%, 45%, .02) 80%, transparent 100%)",
  translateY = -350,
  width = 560,
  height = 1380,
  smallWidth = 240,
  duration = 7,
  xOffset = 100,
}: SpotlightProps = {}) => {
  return (
    <div className="pointer-events-none absolute inset-0 mx-auto max-w-6xl h-full">
      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          duration: 1.5,
        }}
        className="relative h-full w-full"
      >
        <motion.div
          animate={{
            x: [0, xOffset, 0],
          }}
          transition={{
            duration,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          className="absolute top-0 left-0 h-screen z-40 pointer-events-none"
        >
          <div
            style={{
              transform: `translateY(${translateY}px) rotate(-45deg)`,
              background: gradientFirst,
              width: `${width}px`,
              height: `${height}px`,
            }}
            className="absolute top-0 left-0"
          />

          <div
            style={{
              transform: "rotate(-45deg) translate(5%, -50%)",
              background: gradientSecond,
              width: `${smallWidth}px`,
              height: `${height}px`,
            }}
            className="absolute top-0 left-0 origin-top-left"
          />

          <div
            style={{
              transform: "rotate(-45deg) translate(-180%, -70%)",
              background: gradientThird,
              width: `${smallWidth}px`,
              height: `${height}px`,
            }}
            className="absolute top-0 left-0 origin-top-left"
          />
        </motion.div>

        <motion.div
          animate={{
            x: [0, -xOffset, 0],
          }}
          transition={{
            duration,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          className="absolute top-0 right-0 h-screen z-40 pointer-events-none"
        >
          <div
            style={{
              transform: `translateY(${translateY}px) rotate(45deg)`,
              background: gradientFirst,
              width: `${width}px`,
              height: `${height}px`,
            }}
            className="absolute top-0 right-0"
          />

          <div
            style={{
              transform: "rotate(45deg) translate(-5%, -50%)",
              background: gradientSecond,
              width: `${smallWidth}px`,
              height: `${height}px`,
            }}
            className="absolute top-0 right-0 origin-top-right"
          />

          <div
            style={{
              transform: "rotate(45deg) translate(180%, -70%)",
              background: gradientThird,
              width: `${smallWidth}px`,
              height: `${height}px`,
            }}
            className="absolute top-0 right-0 origin-top-right"
          />
        </motion.div>
      </motion.div>
    </div>
  )
}

export function Hero() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [ref, isIntersecting] = useIntersectionObserver({
    threshold: 0,
    rootMargin: "-80px",
  })
  const [count, setCount] = useState(1243)

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
        setCount(prev => prev + 1)
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

  return (
    <div className="relative min-h-screen bg-black/[0.96] antialiased bg-grid-purple/[0.02] overflow-hidden">
      <Spotlight />

      <div className="relative z-10">
        <section
          ref={ref}
          id="waitlist-form"
          className="flex min-h-screen flex-col items-center justify-center px-4 pt-20 pb-10 lg:py-40"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-instrument-sans mb-6 mt-0 text-center text-sm sm:text-base uppercase tracking-[0.51em] text-neutral-100"
          >
            Introducing Magic
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-4xl text-center text-4xl font-bold tracking-tight sm:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400"
          >
            The AI Agent That Builds Beautiful UI Components
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 max-w-2xl text-center text-xl leading-8 text-neutral-300"
          >
            Empower your IDE with an AI extension that creates stunning,
            production-ready components inspired by{" "}
            <Link
              href="https://21st.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-50 transition-colors"
            >
              21st.dev
            </Link>
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

          {/* Mockup Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-20 w-full sm:max-w-[90%] mx-auto relative"
          >
            <MockupFrame className="w-full backdrop-blur">
              <Mockup
                type="responsive"
                className="w-full aspect-[16/10] cursor-pointer"
              >
                <div className="relative w-full h-full group">
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <a
                      href="https://screen.studio/share/2mcsIlwF"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-20 h-20 rounded-full bg-neutral-200/30 backdrop-blur-sm flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                    >
                      <svg
                        className="w-12 h-12 text-white fill-current"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </a>
                  </div>
                  <Image
                    src="https://vucvdpamtrjkzmubwlts.supabase.co/storage/v1/object/public/images//screenshot_magic.png"
                    alt="Magic Agent Demo"
                    fill
                    className="object-cover object-center"
                    priority
                    quality={100}
                  />
                </div>
              </Mockup>
            </MockupFrame>
            <div
              className="absolute bottom-0 left-0 right-0 w-full h-[303px] pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0) 100%)",
                zIndex: 10,
              }}
            />
          </motion.div>
        </section>
      </div>
    </div>
  )
}
