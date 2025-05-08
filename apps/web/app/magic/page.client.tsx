"use client"

import { useState, useEffect, useRef } from "react"
import { Hero } from "@/components/features/magic/hero"
import { HowItWorks } from "@/components/features/magic/how-it-works"
import { FAQ } from "@/components/features/magic/faq"
import { Footer } from "@/components/ui/footer"
import { SupportedEditors } from "@/components/features/magic/supported-editors"
import { Features } from "@/components/features/magic/features"
import { MagicHeader } from "@/components/features/magic/magic-header"

export function MagicPageClient() {
  const [isScrolled, setIsScrolled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

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

  return (
    <div
      ref={scrollRef}
      className="absolute inset-0 min-h-screen w-full overflow-auto bg-black"
    >
      <MagicHeader isScrolled={isScrolled} />

      <main className="relative w-full">
        <Hero />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SupportedEditors />
          <Features />
          <HowItWorks />
          <FAQ />
        </div>
        <Footer isOpenSource={false} className="border-none" />
      </main>
    </div>
  )
}
