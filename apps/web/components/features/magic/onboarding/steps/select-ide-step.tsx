"use client"

import { Button } from "@/components/ui/button"
import { IdeOption } from "@/app/magic/onboarding/page.client"
import { useEffect } from "react"
import { Icons } from "@/components/icons"
import { CursorDark } from "@/components/icons/cursor-dark"
import Image from "next/image"

interface SelectIdeStepProps {
  onSelect: (ide: IdeOption) => void
}

export function SelectIdeStep({ onSelect }: SelectIdeStepProps) {
  // Add keyboard shortcuts for number keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1") {
        e.preventDefault()
        onSelect("cursor")
      } else if (e.key === "2") {
        e.preventDefault()
        onSelect("cline")
      } else if (e.key === "3") {
        e.preventDefault()
        onSelect("windsurf")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onSelect])

  const renderHotkeyHint = (hotkey: string) => {
    return (
      <Button className="mt-2 pr-1.5" variant="outline">
        Press
        <kbd className="pointer-events-none h-5 w-5 justify-center select-none items-center gap-1 rounded border-muted-foreground/40 bg-foreground/10 px-1.5 ml-1.5 font-sans text-[11px] text-foreground leading-none opacity-100 flex">
          {" "}
          {hotkey}
        </kbd>
      </Button>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 px-4">
      <div className="space-y-4 max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">Select Your IDE</h1>
        <p className="text-lg text-muted-foreground">
          Choose the IDE you want to use with Magic MCP
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl z-10">
        {/* Cursor Option */}
        <Button
          variant="outline"
          className="h-auto py-6 px-4 flex flex-col items-center gap-4 hover:bg-primary/5 group bg-background"
          onClick={() => onSelect("cursor")}
        >
          <div className="bg-black rounded-md flex items-center justify-center p-2">
            <CursorDark className="h-10 w-10" />
          </div>
          <div className="text-center">
            <h3 className="font-medium text-lg">Cursor</h3>
          </div>
          {renderHotkeyHint("1")}
        </Button>
        {/* VS Code Option */}
        <Button
          variant="outline"
          className="h-auto py-6 px-4 flex flex-col items-center gap-4 hover:bg-primary/5 group"
          onClick={() => onSelect("cline")}
        >
          <div className="flex items-center justify-center gap-3">
            <Icons.vscode className="w-9 h-9 mr-1" />
            <span className="text-sm text-muted-foreground">+</span>
            <div className="flex items-center gap-2 bg-gradient-to-b from-[#0E0F0F] to-[#0C0C0C] overflow-hidden rounded-xl border border-white/10 w-[53px] h-[53px]">
              <Image
                src="https://avatars.githubusercontent.com/u/184127137?s=200&v=4"
                alt="Cline"
                width={53}
                height={53}
                className="mix-blend-hard-light"
              />
            </div>
          </div>
          <div className="text-center">
            <h3 className="font-medium text-lg">VS Code + Cline</h3>
          </div>
          {renderHotkeyHint("2")}
        </Button>

        {/* Windsurf Option */}
        <Button
          variant="outline"
          className="h-auto py-6 px-4 flex flex-col items-center gap-4 hover:bg-primary/5 group"
          onClick={() => onSelect("windsurf")}
        >
          <div className="flex items-center justify-center">
            <Icons.windsurfTealLogo className="w-14 h-14" />
          </div>
          <div className="text-center">
            <h3 className="font-medium text-lg">Windsurf</h3>
          </div>
          {renderHotkeyHint("3")}
        </Button>
      </div>
    </div>
  )
}