"use client"

import { useEffect } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { SignInButton, SignedOut, SignedIn } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { GitHubStarsBasic } from "@/components/ui/github-stars-number"
import Link from "next/link"
import { Icons } from "@/components/icons"
import { Logo } from "@/components/ui/logo"
import { useIsMobile } from "@/hooks/use-media-query"
// Define props interface
interface MagicHeaderProps {
  isScrolled: boolean
}

export function MagicHeader({ isScrolled }: MagicHeaderProps) {
  const isMobile = useIsMobile()

  return (
    <motion.header
      className={cn(
        "fixed left-4 right-4 z-50 flex items-center justify-between transition-all duration-300 ease-out",
        isScrolled && !isMobile
          ? "top-4 mx-10 rounded-xl border border-white/10 bg-black/70 px-4 py-2 pr-2 shadow-lg backdrop-blur-md"
          : "top-0 rounded-none border-b border-transparent bg-transparent px-4 py-3 shadow-none backdrop-blur-none",
      )}
      initial={{ y: isScrolled ? 0 : -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.5,
      }}
    >
      <div className="flex items-center gap-3">
        <Logo
          fill="white"
          position="flex"
          hasLink={false}
          className="w-6 h-6"
        />
        <span className="text-white font-medium">
          Magic <span className="font-light text-gray-400">by 21st.dev</span>
        </span>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-2.5 text-sm font-medium text-white hover:bg-neutral-800/10 hover:text-white"
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
              className="text-white"
            />
          </a>
        </Button>
        <Button
          variant="ghost"
          className="text-white text-[14px] hover:text-gray-300 hover:bg-accent/10"
        >
          <Link href="/pricing">Pricing</Link>
        </Button>
        <SignedIn>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/magic/get-started">Get Started</Link>
          </Button>
        </SignedIn>
        <SignedOut>
          <SignInButton>
            <Button>Sign up</Button>
          </SignInButton>
        </SignedOut>
      </div>
    </motion.header>
  )
}
