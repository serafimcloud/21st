import Link from "next/link"
import { cn } from "@/lib/utils"
import { Icons } from "../icons"
import { ThemeToggle } from "./theme-toggle"
import { GitHubStars } from "./github-stars-number"
import { Button } from "@/components/ui/button"
import { Twitter } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function HeaderServer({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/"
        className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer bg-foreground"
      />
      {text && (
        <div className="flex items-center gap-2">
          <Icons.slash className="text-border w-[22px] h-[22px]" />
          <span className="text-[14px] font-medium">{text}</span>
        </div>
      )}
    </div>
  )
}

HeaderServer.SocialIcons = function SocialIcons() {
  return (
    <div className="flex items-center gap-1">
      <Link href="https://x.com/serafimcloud" target="_blank" rel="noreferrer">
        <Button
          variant="ghost"
          aria-label="Follow on Twitter"
          className="fill-foreground size-8"
        >
          <Twitter
            className="min-h-[16px] max-h-[16px] min-w-[16px] max-w-[16px] fill-current"
            aria-hidden="true"
          />
        </Button>
      </Link>
      <Link
        href="https://discord.gg/Qx4rFunHfm"
        target="_blank"
        rel="noreferrer"
      >
        <Button
          variant="ghost"
          aria-label="Join Discord"
          className="fill-foreground size-8"
        >
          <Icons.discord
            className="min-h-[18px] min-w-[18px]"
            aria-hidden="true"
          />
        </Button>
      </Link>
      <div className="flex items-center gap-2 ml-1">
        <Link
          href="https://github.com/serafimcloud/21st"
          target="_blank"
          rel="noreferrer"
        >
          <Button className="h-8 py-0 pe-0 shadow-none" variant="outline">
            <Icons.gitHub
              className="h-[18px] w-[18px] me-2"
              aria-hidden="true"
            />
            Star
            <GitHubStars />
            <span className="sr-only">GitHub</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}

HeaderServer.ThemeToggle = ThemeToggle
