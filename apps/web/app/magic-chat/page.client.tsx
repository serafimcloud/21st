"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Footer } from "@/components/ui/footer"
import { MagicHeader } from "@/components/features/magic/magic-header"
import { Mockup, MockupFrame } from "@/components/ui/mockup"
import { Icons } from "@/components/icons"
import { Spinner } from "@/components/icons/spinner"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

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

// Success Modal Component
const SuccessModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-black/95 backdrop-blur-xl border border-white/10 max-w-sm rounded-xl p-6"
        hideCloseButton={true}
      >
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
            <Icons.check className="w-5 h-5 text-green-400" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <DialogTitle className="font-semibold text-white mb-2">
            You're on the waitlist!
          </DialogTitle>

          <DialogDescription className="text-muted-foreground text-sm">
            We'll notify you when Magic Chat launches.
          </DialogDescription>
        </div>

        {/* Call to action section */}
        <div className="text-center mb-6">
          <p className="font-semibold text-white mb-1 text-sm">
            Want early access?
          </p>
          <p className="text-muted-foreground text-sm">
            Subscribe to get immediate access to the beta
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/pricing">Subscribe for Early Access</Link>
          </Button>

          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-muted-foreground hover:text-white hover:bg-white/5"
          >
            I'll wait for the launch
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function MagicChatPageClient() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const [successModalOpen, setSuccessModalOpen] = useState(false)

  useEffect(() => {
    const scrollElement = scrollRef.current

    const handleScroll = () => {
      if (scrollElement) {
        setIsScrolled(scrollElement.scrollTop > 30)
      }
    }

    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll)
      handleScroll()

      return () => {
        scrollElement.removeEventListener("scroll", handleScroll)
      }
    }
  }, [])

  const handleSubscribe = async () => {
    if (!email) {
      setError("Please enter your email")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          type: "magic-chat",
        }),
      })

      if (response.ok) {
        setEmail("")
        setSuccessModalOpen(true)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to subscribe")
      }
    } catch (error) {
      setError("Failed to subscribe. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubscribe()
    }
  }

  const handlePlayDemo = () => {
    // Replace with your actual demo video URL
    window.open("https://www.youtube.com/watch?v=your-demo-video", "_blank")
  }

  const closeSuccessModal = () => {
    setSuccessModalOpen(false)
  }

  return (
    <div
      ref={scrollRef}
      className="absolute inset-0 min-h-screen w-full overflow-auto bg-black"
    >
      <MagicHeader isScrolled={isScrolled} />

      <main className="relative w-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="relative min-h-screen bg-[url('/magic-chat-waitilist.webp')] bg-cover bg-top bg-center bg-no-repeat antialiased overflow-hidden sm:bg-contain sm:bg-repeat-x"
        >
          <Spotlight />

          <div className="relative z-10">
            <section className="flex min-h-screen flex-col items-center justify-center px-4 pt-20 pb-10 lg:py-40">
              <motion.p
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.8,
                  delay: 0.2,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="font-instrument-sans mb-6 mt-0 text-center text-[12px] sm:text-base uppercase tracking-[0.51em] text-white"
              >
                Introducing Magic Chat
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.8,
                  delay: 0.4,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="max-w-4xl text-center text-3xl font-semibold tracking-tight sm:text-7xl"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="bg-clip-text text-transparent bg-gradient-to-b from-white/95 to-white/80 backdrop-blur-xl pb-1">
                    Create standout components
                  </span>
                </div>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.8,
                  delay: 0.6,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="mt-6 max-w-2xl text-center sm:text-xl leading-8 text-white"
              >
                Start with a prompt, iterate in chat, and draw inspiration from
                the best works of 21st.dev's top design engineers
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.8,
                  delay: 0.8,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="mt-10 w-full max-w-md"
              >
                <div className="space-y-4 flex flex-col items-center">
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm h-8 max-w-[300px]"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSubscribe}
                      disabled={isLoading || !email}
                      className={cn(
                        "whitespace-nowrap bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-none",
                        isLoading ? "" : "",
                      )}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <Spinner size={16} color="white" />
                          Joining...
                        </div>
                      ) : (
                        "Join Waitlist"
                      )}
                    </Button>
                  </div>
                  {error && (
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  )}
                </div>
              </motion.div>

              {/* Mockup Section */}
              <motion.div
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.8,
                  delay: 1.0,
                  ease: [0.25, 1, 0.5, 1],
                }}
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
                        alt="Magic Chat Demo"
                        className="object-cover object-center"
                      />
                      {/* Play Button Overlay removed temporarily */}
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

        <Footer isOpenSource={false} className="border-none" />
      </main>

      <SuccessModal isOpen={successModalOpen} onClose={closeSuccessModal} />
    </div>
  )
}
