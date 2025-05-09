"use client"

import { useRouter } from "next/navigation"
import { useAnimation } from "motion/react"
import { useClerk } from "@clerk/nextjs"
import { User } from "@/types/global"
import { useSidebar } from "@/components/ui/sidebar"
import { Icons } from "@/components/icons"
import { Logo } from "@/components/ui/logo"
import { UserAvatar } from "@/components/ui/user-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface StudioHeaderProps {
  user: User
}

export function StudioHeader({ user }: StudioHeaderProps) {
  const router = useRouter()
  const controls = useAnimation()
  const { signOut } = useClerk()
  const { open, setOpen } = useSidebar()

  return (
    <header className="flex fixed top-0 left-0 right-0 h-14 z-50 items-center pl-2 pr-4 py-3 text-foreground border-b border-border/40 bg-background">
      <div className="flex items-center flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="mr-3"
          onClick={() => setOpen(!open)}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Logo position="flex" hasLink={false} className="w-5 h-5" />

        <div className="flex items-center gap-2 ml-2">
          <Icons.slash className="text-border w-[22px] h-[22px]" />
          <span className="text-[14px] font-medium">Creator Studio</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer rounded-full ml-2">
            <UserAvatar
              src={user?.display_image_url || user?.image_url || undefined}
              alt={user?.display_name || user?.name || undefined}
              size={32}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[240px] p-0" align="end">
            <div className="p-3 border-b border-border">
              <p className="text-sm text-foreground">{user?.email}</p>
            </div>

            <div className="p-1">
              <DropdownMenuItem
                className="text-sm px-3 py-2 cursor-pointer"
                onSelect={() => {
                  if (user?.display_username) {
                    router.push(`/${user.display_username}`)
                  } else if (user?.username) {
                    router.push(`/${user.username}`)
                  }
                }}
              >
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-sm px-3 py-2 cursor-pointer flex items-center justify-between"
                onSelect={() => router.push("/")}
              >
                Back to Home
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-sm px-3 py-2 cursor-pointer flex items-center justify-between"
                onSelect={() => router.push("/settings/profile")}
              >
                Settings
                <Icons.settings className="h-4 w-4" />
              </DropdownMenuItem>
            </div>

            <div className="border-t border-border p-1">
              <DropdownMenuItem
                onSelect={() => signOut({ redirectUrl: "/" })}
                className="text-sm px-3 py-2 cursor-pointer flex justify-between items-center"
                onMouseEnter={() => controls.start("hover")}
                onMouseLeave={() => controls.start("normal")}
              >
                <span>Log Out</span>
                <Icons.logout size={16} controls={controls} />
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
