"use client"

import { Footer } from "@/components/ui/footer"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { HeroPill, StarIcon } from "@/components/ui/hero-pill"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Spinner } from "@/components/icons/spinner"
import { Logo } from "@/components/ui/logo"

// Spotlight component from hero.tsx
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
}) => {
  return (
    <div className="pointer-events-none absolute inset-0 mx-auto max-w-6xl h-full">
      <motion.div
        initial={{ filter: "blur(8px)", y: 10 }}
        animate={{ filter: "blur(0px)", y: 0 }}
        transition={{ duration: 0.8, ease: "linear" }}
        className="relative h-full w-full"
      >
        <motion.div
          animate={{ x: [0, xOffset, 0] }}
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
          animate={{ x: [0, -xOffset, 0] }}
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

export default function StudioPage() {
  const { user, isLoaded } = useUser()
  const [studioUrl, setStudioUrl] = useState("/studio")
  const [username, setUsername] = useState("")
  const [isEnterPressed, setIsEnterPressed] = useState(false)

  // Set username from Clerk user data
  useEffect(() => {
    if (!isLoaded || !user) return

    // Get username from all available sources
    const usernameFromClerk = user.username ?? ""

    if (usernameFromClerk) {
      setUsername(usernameFromClerk)
      setStudioUrl(`/studio/${usernameFromClerk}`)
    }
  }, [user, isLoaded])

  // Add keyboard shortcut for Enter key
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter" && username) {
        setIsEnterPressed(true)

        // Navigate to studio URL
        setTimeout(() => {
          window.location.href = studioUrl
        }, 200)
      }
    }

    document.addEventListener("keydown", handleKeyPress)

    return () => {
      document.removeEventListener("keydown", handleKeyPress)
    }
  }, [username, studioUrl])

  return (
    <div className="min-h-screen flex flex-col bg-black text-white overflow-hidden">
      <div className="flex-1 relative antialiased">
        {/* Background image approach similar to hero.tsx */}
        <div className="absolute inset-0 z-0 bg-[url('/studio-background.webp')] bg-top bg-no-repeat bg-contain sm:bg-repeat-x">
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/90"></div>
        </div>

        <Spotlight />

        <div className="relative z-10">
          {/* Hero Section */}
          <Logo position="flex" className="ml-4 mt-3" />
          <section className="relative overflow-hidden pt-32 md:pt-40 pb-16">
            <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col items-center text-center mb-12 md:mb-16">
                <motion.div
                  initial={{ filter: "blur(8px)", y: 10 }}
                  animate={{ filter: "blur(0px)", y: 0 }}
                  transition={{
                    duration: 0.8,
                    ease: "linear",
                  }}
                >
                  <HeroPill
                    icon={<StarIcon />}
                    text="Introducing Monetization"
                    className="flex justify-center"
                  />
                </motion.div>

                <motion.h1
                  initial={{ filter: "blur(8px)", y: 10 }}
                  animate={{ filter: "blur(0px)", y: 0 }}
                  transition={{
                    duration: 0.8,
                    ease: "linear",
                  }}
                  className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight mt-4 mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80"
                >
                  Share Your Components
                  <br className="hidden sm:block" />
                  with the World
                </motion.h1>

                <motion.p
                  initial={{ filter: "blur(8px)", y: 10 }}
                  animate={{ filter: "blur(0px)", y: 0 }}
                  transition={{
                    duration: 0.8,
                    ease: "linear",
                  }}
                  className="text-base sm:text-lg md:text-xl text-neutral-300 max-w-2xl mb-8 md:mb-10 px-4"
                >
                  Join the community of design engineers and publish your UI
                  components to 21st.dev
                </motion.p>

                <motion.div
                  initial={{ filter: "blur(4px)", y: 10 }}
                  animate={{ filter: "blur(0px)", y: 0 }}
                  transition={{
                    duration: 0.8,
                    ease: "linear",
                  }}
                  className="flex flex-wrap gap-4 justify-center"
                >
                  {username ? (
                    <Button
                      asChild
                      variant="outline"
                      className="bg-white !text-black hover:bg-white/90 hover:!text-black border-white shadow-sm"
                      onClick={(e) => {
                        setIsEnterPressed(true)
                        setTimeout(() => {
                          window.location.href = studioUrl
                        }, 200)
                        e.preventDefault()
                      }}
                    >
                      <Link href={studioUrl}>
                        <div className="flex items-center gap-2">
                          {isEnterPressed && (
                            <Spinner size={16} color="black" />
                          )}
                          {isEnterPressed ? "Opening..." : "Go to Studio"}
                        </div>
                        <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border border-neutral-300 bg-neutral-100 px-1.5 ml-1.5 font-sans text-[11px] text-neutral-600 leading-none opacity-100 flex">
                          <Icons.enter className="h-2.5 w-2.5" />
                        </kbd>
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      disabled
                      variant="outline"
                      className="bg-white/80 !text-black border-white/80 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        Go to Studio
                        <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border border-neutral-300 bg-neutral-100 px-1.5 ml-1.5 font-sans text-[11px] text-neutral-600 leading-none opacity-100 flex">
                          <Icons.enter className="h-2.5 w-2.5" />
                        </kbd>
                      </div>
                    </Button>
                  )}
                </motion.div>
              </div>

              {/* Stats */}
              <motion.div
                initial={{ filter: "blur(8px)", y: 10 }}
                animate={{ filter: "blur(0px)", y: 0 }}
                transition={{
                  duration: 0.8,
                  ease: "linear",
                }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 my-12 md:my-16 max-w-4xl mx-auto px-4"
              >
                {[
                  { value: "100k+", label: "Monthly Users" },
                  { value: "2k+", label: "Components" },
                  { value: "124k+", label: "Monthly Downloads" },
                  { value: "100+", label: "Contributors" },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="flex flex-col items-center p-4 sm:p-6 rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm transition-all hover:bg-black/40 hover:border-white/20 hover:shadow-md"
                  >
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-300 text-center">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
          {/* Features */}
          <motion.section
            className="py-12 md:py-16 container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.8,
              ease: "linear",
            }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 md:mb-12 bg-clip-text text-transparent bg-gradient-to-t from-gray-300/70 to-white">
              Why Publish on 21st.dev?
            </h2>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {[
                {
                  icon: (
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
                  ),
                  title: "Build Your Brand",
                  description:
                    "Establish yourself as a trusted creator in the developer community.",
                },
                {
                  icon: (
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
                      <circle cx="12" cy="12" r="10" />
                      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                      <path d="M12 18V6" />
                    </svg>
                  ),
                  title: "Monetization",
                  description:
                    "Earn income through our partnership program. Turn UI into revenue.",
                },
                {
                  icon: (
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
                  ),
                  title: "Reach Developers",
                  description:
                    "Connect with thousands of developers and vibe coders instantly.",
                },
                {
                  icon: (
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
                  ),
                  title: "Detailed Analytics",
                  description:
                    "Track performance with real-time usage stats and feedback.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex flex-col rounded-xl border border-white/10 bg-black/30 p-4 shadow-sm transition-all hover:bg-black/40 hover:border-white/20 hover:shadow-md backdrop-blur-sm"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-white">
                    {feature.icon}
                  </div>
                  <h3 className="text-base font-bold mb-1.5 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* CTA */}
          <section className="py-12 md:py-16 container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
            <motion.div
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.8,
                ease: "linear",
              }}
              className="rounded-xl border border-white/10 bg-black/30 p-6 sm:p-8 shadow-sm backdrop-blur-sm hover:bg-black/40 hover:border-white/20 transition-all"
            >
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-xl sm:text-2xl font-bold mb-2 text-white text-center md:text-left"
                  >
                    Ready to share your components?
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="text-sm sm:text-base text-neutral-300 text-center md:text-left"
                  >
                    Start publishing your components and join the 21st.dev
                    community
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="text-sm sm:text-base text-white/70 text-center md:text-left mt-2"
                  >
                    <span className="inline-flex items-center bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 text-emerald-300 px-2 py-1 rounded-md text-xs font-medium">
                      <svg
                        className="w-3 h-3 mr-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      NEW
                    </span>{" "}
                    Monetize your UI components through our partner program
                  </motion.p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  {username ? (
                    <Button
                      asChild
                      variant="outline"
                      className="bg-white !text-black hover:bg-white/90 hover:!text-black border-white shadow-sm"
                      onClick={(e) => {
                        setIsEnterPressed(true)
                        setTimeout(() => {
                          window.location.href = studioUrl
                        }, 200)
                        e.preventDefault()
                      }}
                    >
                      <Link href={studioUrl}>
                        <div className="flex items-center gap-2">
                          {isEnterPressed && (
                            <Spinner size={16} color="black" />
                          )}
                          {isEnterPressed
                            ? "Opening Studio..."
                            : "Go to Studio"}
                        </div>
                        <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border border-neutral-300 bg-neutral-100 px-1.5 ml-1.5 font-sans text-[11px] text-neutral-600 leading-none opacity-100 flex">
                          <Icons.enter className="h-2.5 w-2.5" />
                        </kbd>
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      disabled
                      variant="outline"
                      className="bg-white/80 !text-black border-white/80 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        Go to Studio
                      </div>
                    </Button>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </section>
        </div>
      </div>
      <Footer isOpenSource={false} className="border-none" />
    </div>
  )
}
