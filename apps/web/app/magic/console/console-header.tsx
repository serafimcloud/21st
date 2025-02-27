"use client"

import Link from "next/link"
import { MessageSquare } from "lucide-react"

export function ConsoleHeader() {
  return (
    <header className="top-0 z-10 flex h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <Link 
          className="flex items-center justify-center w-[22px] h-[22px] rounded-full bg-foreground hover:opacity-90 transition-opacity" 
          href="/magic"
        />
        <div className="flex items-center gap-2">
          <svg 
            height="16" 
            stroke-linejoin="round" 
            viewBox="0 0 16 16" 
            width="16" 
            className="text-border w-[22px] h-[22px] hidden sm:block"
          >
            <path 
              fill-rule="evenodd" 
              clip-rule="evenodd" 
              d="M4.01526 15.3939L4.3107 14.7046L10.3107 0.704556L10.6061 0.0151978L11.9849 0.606077L11.6894 1.29544L5.68942 15.2954L5.39398 15.9848L4.01526 15.3939Z" 
              fill="currentColor"
            />
          </svg>
          <span className="text-[14px] font-medium hidden sm:inline-block">Magic</span>
        </div>
      </div>
      <Link
        target="_blank"
        className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:opacity-50 disabled:pointer-events-none disabled:border-primary/75 disabled:shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.15)] [&_svg]:pointer-events-none [&_svg]:shrink-0 border border-input bg-background shadow-sm shadow-black/5 hover:bg-accent hover:text-accent-foreground h-8 rounded-lg px-3 gap-2 whitespace-nowrap"
        href="https://discord.gg/Qx4rFunHfm"
      >
        <MessageSquare className="block sm:hidden h-4 w-4" />
        <span className="hidden sm:inline-block">Feedback</span>
      </Link>
    </header>
  )
}
