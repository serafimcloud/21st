"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface FooterProps {
  className?: string
  isOpenSource?: boolean
}

export function Footer({ className, isOpenSource = true }: FooterProps) {
  return (
    <footer className={cn("border-t border-border/40", className)}>
      <div className="container mx-auto px-[var(--container-x-padding)] max-w-[3680px] [--container-x-padding:20px] min-720:[--container-x-padding:24px] min-1280:[--container-x-padding:32px] min-1536:[--container-x-padding:80px]">
        {isOpenSource && (
          <div className="flex md:hidden items-center justify-center pt-4 text-center">
            <span className="text-sm text-muted-foreground">
              The source code is available on{" "}
              <Link
                href="https://github.com/serafimcloud/21st"
                target="_blank"
                className="font-medium underline-offset-4 hover:underline"
              >
                GitHub
              </Link>
            </span>
          </div>
        )}
        <div className="flex flex-row h-auto pb-4 mt-2 sm:mt-0 gap-4 text-center items-center justify-between md:h-12 md:py-0">
          <div className="flex items-center text-sm text-muted-foreground">
            21st Labs Inc.
          </div>
          <div className="hidden md:flex md:items-center md:gap-1 md:text-sm md:text-muted-foreground">
            {isOpenSource && (
              <span className="flex items-center gap-1 whitespace-nowrap">
                The source code is available on{" "}
                <Link
                  href="https://github.com/serafimcloud/21st"
                  target="_blank"
                  className="font-medium underline-offset-4 hover:underline"
                >
                  GitHub
                </Link>
              </span>
            )}
          </div>
          <nav className="flex items-center justify-end gap-2 md:gap-4">
            <Link
              href="/our-story"
              className="text-sm text-muted-foreground hover:underline underline-offset-4"
            >
              Our Story
            </Link>
            <Link
              href="https://discord.gg/Qx4rFunHfm"
              target="_blank"
              className="text-sm text-muted-foreground hover:underline underline-offset-4"
            >
              Discord
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
