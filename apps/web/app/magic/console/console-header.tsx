"use client"

import Link from "next/link"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { MessageSquare, Sparkles } from "lucide-react"

export function ConsoleHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/magic" className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <span className="font-medium">Magic Console</span>
        </Link>
        <div className="flex flex-1 items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground"
          >
            <Link
              href="https://discord.gg/Qx4rFunHfm"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Feedback</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
