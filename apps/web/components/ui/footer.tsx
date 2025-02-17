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
        <div className="flex flex-col h-auto py-4 gap-4 text-center md:flex-row md:h-14 md:items-center md:justify-between md:py-0">
          <div className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground md:flex-nowrap md:justify-start">
            Built by{" "}
            <Link
              href="https://x.com/serafimcloud"
              target="_blank"
              className="font-medium underline-offset-4 hover:underline"
            >
              serafim
            </Link>{" "}
            &{" "}
            <Link
              href="https://github.com/serafimcloud/21st/graphs/contributors"
              target="_blank"
              className="font-medium underline-offset-4 hover:underline"
            >
              friends
            </Link>
            {isOpenSource && (
              <>
                . The source code is available on{" "}
                <Link
                  href="https://github.com/serafimcloud/21st"
                  target="_blank"
                  className="font-medium underline-offset-4 hover:underline"
                >
                  GitHub
                </Link>
              </>
            )}
            .
          </div>
          <nav className="flex items-center justify-center gap-4 md:justify-end">
            <Link
              href="/api-access"
              className="text-sm text-muted-foreground hover:underline underline-offset-4"
            >
              API
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
