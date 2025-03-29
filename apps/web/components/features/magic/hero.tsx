"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import NumberFlow from "@number-flow/react"
import { Button } from "@/components/ui/button"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Mockup, MockupFrame } from "@/components/ui/mockup"
import { GitHubStarsBasic } from "@/components/ui/github-stars-number"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/icons/spinner"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import {
  trackAttribution,
  ATTRIBUTION_SOURCE,
  SOURCE_DETAIL,
} from "@/lib/attribution-tracking"

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
  const [count, setCount] = useState(20114)
  const [isLoading, setIsLoading] = useState(false)
  const [ref, isIntersecting] = useIntersectionObserver({
    threshold: 0,
    rootMargin: "-80px",
  })
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault()
        setIsLoading(true)
        trackMagicGetStarted()
        setTimeout(() => {
          router.push("/magic/get-started")
        }, 800)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [router])

  const trackMagicGetStarted = () => {
    trackAttribution(ATTRIBUTION_SOURCE.MAGIC, SOURCE_DETAIL.MAGIC_LANDING_HERO)
  }

  const handleGetStartedClick = () => {
    setIsLoading(true)
    trackMagicGetStarted()
    setTimeout(() => {
      router.push("/magic/get-started")
    }, 800)
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
            <div className="flex justify-center items-center gap-2">
              <Button
                onClick={handleGetStartedClick}
                disabled={isLoading}
                className={cn(
                  "whitespace-nowrap bg-white/10 text-neutral-200 hover:bg-white/20 backdrop-blur-sm border-none",
                  isLoading ? "" : "pr-1.5",
                )}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Spinner size={16} />
                    Getting Started...
                  </div>
                ) : (
                  <>
                    Get Started
                    <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-kbd leading-none opacity-100 flex">
                      <Icons.enter className="h-2.5 w-2.5" />
                    </kbd>
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 px-2.5 text-sm font-medium text-neutral-200 hover:text-neutral-50"
                asChild
              >
                <a
                  href="https://github.com/21st-dev/magic-mcp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icons.gitHub className="h-4 w-4" />
                  <GitHubStarsBasic
                    repo="21st-dev/magic-mcp"
                    className="text-neutral-200"
                  />
                </a>
              </Button>
            </div>

            <div className="flex items-center justify-center mt-4 px-2">
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
                  <NumberFlow value={count} />+ people using Magic
                </span>
              </div>
            </div>
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
                  <img
                    src="https://vucvdpamtrjkzmubwlts.supabase.co/storage/v1/object/public/images//screenshot_magic.png"
                    alt="Magic Agent Demo"
                    className="object-cover object-center"
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
