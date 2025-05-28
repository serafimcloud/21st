"use client"

import { useState, useEffect, useLayoutEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import NumberFlow from "@number-flow/react"
import { Button } from "@/components/ui/button"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

const rotatingWords = [
  "UI Components",
  "Landing Pages",
  "Login Forms",
  "Dashboards",
  "Image Galleries",
  "Hero Sections",
]

function RotatingText() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [calculatedWidth, setCalculatedWidth] = useState<number | string>(
    "auto",
  )

  // Measure the width of the current word using useLayoutEffect to prevent flicker
  useLayoutEffect(() => {
    // Prevent measuring if index is invalid
    if (currentIndex < 0 || currentIndex >= rotatingWords.length) return

    const measureSpan = document.createElement("span")
    measureSpan.style.position = "absolute"
    measureSpan.style.visibility = "hidden"
    measureSpan.style.whiteSpace = "nowrap"
    // Apply similar font styles for accurate measurement
    // Assuming the parent h1 has these classes: text-4xl font-bold tracking-tight sm:text-7xl
    measureSpan.className = "text-3xl font-bold tracking-tight sm:text-7xl"
    measureSpan.textContent = rotatingWords[currentIndex] ?? ""

    document.body.appendChild(measureSpan)
    const width = measureSpan.offsetWidth
    document.body.removeChild(measureSpan)

    setCalculatedWidth(width > 0 ? width : "auto") // Set width or 'auto' if measurement fails
  }, [currentIndex])

  // Effect for cycling words
  useEffect(() => {
    // Start the interval after the initial word has been displayed for 1 second
    const cycleTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        setIsVisible(false) // Start fading out
        setTimeout(() => {
          // Wait for fade out before changing word
          setCurrentIndex((prev) => (prev + 1) % rotatingWords.length)
          setIsVisible(true) // Start fading in the new word
        }, 400) // Exit animation duration (matches transition duration)
      }, 4000) // Time each word is displayed

      // Cleanup function for the interval
      return () => clearInterval(interval)
    }, 1000) // Delay before starting the *first* cycle - reduced to 1000ms

    // Cleanup function for the initial timeout
    return () => clearTimeout(cycleTimeout)
  }, []) // Empty dependency array means this runs once on mount

  // Define transitions
  const widthTransition = { duration: 0.6, ease: [0.32, 0.72, 0, 1] }

  return (
    // Use simple div for flex layout, change items-center to items-baseline
    <div className="flex items-baseline justify-center gap-3 relative">
      {/* Static text - simple div */}
      <div className="relative whitespace-nowrap  bg-clip-text text-transparent bg-gradient-to-b from-neutral-800/90 to-neutral-700/90">
        Beautiful
      </div>

      {/* Width-animated container */}
      <motion.div
        className="relative h-[28px] sm:h-[61px]"
        animate={{ width: calculatedWidth }}
        transition={widthTransition}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={currentIndex}
            className="absolute overflow-y-visible top-0 left-0 whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-b from-neutral-800/90 to-neutral-700/90 pb-1"
            initial={{ opacity: 0, y: -20, filter: "blur(4px)" }}
            animate={{
              opacity: isVisible ? 1 : 0,
              y: isVisible ? 0 : 0,
              filter: isVisible ? "blur(0px)" : "blur(4px)",
            }}
            exit={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            transition={{
              opacity: { duration: 0.3 },
              y: { duration: 0.4 },
              filter: { duration: 0.3 },
            }}
          >
            {rotatingWords[currentIndex]}
          </motion.div>
        </AnimatePresence>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
      className="relative min-h-screen bg-[url('/hero.webp')] bg-cover bg-top bg-center bg-no-repeat antialiased overflow-hidden sm:bg-contain sm:bg-repeat-x"
    >
      <Spotlight />

      <div className="relative z-10">
        <section
          ref={ref}
          id="waitlist-form"
          className="flex min-h-screen flex-col items-center justify-center px-4 pt-20 pb-10 lg:py-40"
        >
          <motion.p
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="font-instrument-sans mb-6 mt-0 text-center text-[12px] sm:text-base uppercase tracking-[0.51em] text-black"
          >
            Introducing Magic
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className="max-w-4xl text-center text-3xl font-bold tracking-tight sm:text-7xl"
          >
            <div className="flex flex-col items-center gap-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-950/90 to-neutral-800/90 backdrop-blur-xl pb-1">
                AI Agent That Builds
              </span>
              <RotatingText />
            </div>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 1, 0.5, 1] }}
            className="mt-6 max-w-2xl text-center sm:text-xl leading-8 text-black"
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
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.8, ease: [0.25, 1, 0.5, 1] }}
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
                    <Spinner size={16} color="white" />
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
                className="gap-2 px-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-800/10 hover:text-neutral-800"
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
                    className="text-neutral-800"
                  />
                </a>
              </Button>
            </div>

            {/* Updated Avatar Section - Real images with hover effect */}
            <motion.div
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.8,
                delay: 0.9,
                ease: [0.25, 1, 0.5, 1],
              }}
              className="mt-6 flex justify-center"
            >
              <div className="flex items-center gap-4 p-2">
                <div className="flex -space-x-3">
                  {[
                    {
                      src: "https://pbs.twimg.com/profile_images/1836541543857164289/VhzOa4y0_400x400.jpg",
                      alt: "Yoko Li",
                      href: "https://x.com/stuffyokodraws",
                      fallback: "YL",
                    },
                    {
                      src: "https://pbs.twimg.com/profile_images/1833137601207009280/gGSDe5DF_400x400.jpg",
                      alt: "Melvin Vivas",
                      href: "https://x.com/donvito",
                      fallback: "MV",
                    },
                    {
                      src: "https://pbs.twimg.com/profile_images/1916508496117346304/7nXjRvdN_400x400.jpg",
                      alt: "Gil",
                      href: "https://x.com/gilgNYC",
                      fallback: "G",
                    },
                  ].map((avatar, index) => (
                    <motion.a
                      key={avatar.alt}
                      href={avatar.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative group overflow-hidden backdrop-blur-[1px] rounded-full"
                      whileHover={{ scale: 1.05, zIndex: 10 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 10,
                      }}
                    >
                      <Avatar className="h-8 w-8 border  border-black/10 backdrop-blur-xl transition-transform duration-150 ease-in-out group-hover:scale-110">
                        <AvatarImage src={avatar.src} alt={avatar.alt} />
                        <AvatarFallback className={`text-white/80 text-sm ${
                          index === 0 ? "bg-neutral-700" :
                          index === 1 ? "bg-neutral-600" :
                          "bg-neutral-500"
                        }`}>
                          {avatar.fallback}
                        </AvatarFallback>
                      </Avatar>
                      {/* Tooltip */}
                      <span className="absolute bottom-full left-1/2 z-20 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded bg-neutral-800/90 px-2 py-0.5 text-[10px] font-medium text-neutral-100 opacity-0 transition-opacity duration-200 group-hover:opacity-100 invisible group-hover:visible">
                        {avatar.alt}
                      </span>
                    </motion.a>
                  ))}
                </div>
                <span className="text-sm text-neutral-800">
                  <NumberFlow value={count} />+ people using Magic
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Mockup Section */}
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 1.0, ease: [0.25, 1, 0.5, 1] }}
            className="mt-20 w-full sm:max-w-[90%] mx-auto relative"
          >
            <MockupFrame className="w-full max-w-[1400px] mx-auto backdrop-blur">
              <Mockup
                type="responsive"
                className="w-full aspect-[16/10] cursor-pointer"
              >
                <div className="relative w-full h-full group">
                  <img
                    src="/magic-preview.webp"
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
    </motion.div>
  )
}
