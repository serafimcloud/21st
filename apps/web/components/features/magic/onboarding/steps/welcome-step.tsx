"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useEffect, useRef } from "react"
import { Icons } from "@/components/icons"

interface WelcomeStepProps {
  onComplete: () => void
}

export function WelcomeStep({ onComplete }: WelcomeStepProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Add keyboard shortcut for Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey
      ) {
        e.preventDefault()
        onComplete()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onComplete])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 px-4">
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to Magic MCP
        </h1>
        <p className="text-xl text-muted-foreground">
          Magic MCP helps you create beautiful UI components with AI in seconds.
          Let's get you set up with everything you need.
        </p>
      </div>

      <Button onClick={onComplete} ref={buttonRef} className="mt-8">
        Continue
        <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-muted leading-none opacity-100 flex">
          <Icons.enter className="h-2.5 w-2.5" />
        </kbd>
      </Button>
    </div>
  )
}
