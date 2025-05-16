"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  HelpCircle,
  ArrowUpRight,
  LifeBuoy,
  Settings,
  Bug,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface KeyboardKeyProps {
  children: React.ReactNode
  className?: string
}

interface HelpProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function KeyboardKey({ children, className }: KeyboardKeyProps) {
  return (
    <kbd
      className={cn(
        "px-1 py-0.5 min-w-[22px] flex items-center justify-center text-xs text-foreground bg-muted rounded border shadow-sm",
        className,
      )}
    >
      {children}
    </kbd>
  )
}

function ShortcutItem({
  label,
  shortcut,
}: {
  label: string
  shortcut: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-2 py-1 text-sm text-muted-foreground">
      <span>{label}</span>
      <div className="flex gap-1">{shortcut}</div>
    </div>
  )
}

function ExternalLink({
  href,
  icon: Icon,
  children,
  showArrow = true,
}: {
  href: string
  icon: React.ComponentType<any>
  children: React.ReactNode
  showArrow?: boolean
}) {
  return (
    <DropdownMenuItem asChild>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {children}
        </div>
        {showArrow && (
          <ArrowUpRight className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        )}
      </Link>
    </DropdownMenuItem>
  )
}

function ShortcutsList() {
  return (
    <div className="py-2">
      <DropdownMenuLabel>Keyboard Shortcuts</DropdownMenuLabel>
      <div className="mb-2">
        <ShortcutItem
          label="Show help"
          shortcut={<KeyboardKey>?</KeyboardKey>}
        />
        <ShortcutItem
          label="Search"
          shortcut={
            <>
              <KeyboardKey>⌘ K</KeyboardKey>
            </>
          }
        />
        <ShortcutItem
          label="Toggle sidebar"
          shortcut={<KeyboardKey>S</KeyboardKey>}
        />
      </div>

      <DropdownMenuSeparator />
      <DropdownMenuLabel>Actions</DropdownMenuLabel>

      <ExternalLink href="https://discord.gg/Qx4rFunHfm" icon={LifeBuoy}>
        Community Support
      </ExternalLink>

      <ExternalLink href="mailto:support@21st.dev" icon={Mail}>
        Support Email
      </ExternalLink>

      <ExternalLink
        href="https://github.com/serafimcloud/21st/issues"
        icon={Bug}
      >
        Report a Bug
      </ExternalLink>

      <ExternalLink
        href="https://21st.dev/settings"
        icon={Settings}
        showArrow={false}
      >
        Settings
      </ExternalLink>
    </div>
  )
}

export function Help({ open, onOpenChange }: HelpProps) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-accent"
          aria-label="Help menu"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="end"
        className="w-64"
        sideOffset={8}
        forceMount
      >
        <ShortcutsList />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
