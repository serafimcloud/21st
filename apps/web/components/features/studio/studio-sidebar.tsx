import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/ui/user-avatar"
import { User } from "@/types/global"
import { BarChartBig, CreditCard, Layers } from "lucide-react"

interface StudioSidebarProps {
  user: User
}

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  disabled?: boolean
}

export function StudioSidebar({ user }: StudioSidebarProps) {
  const pathname = usePathname()

  // Get the base username path
  const baseUsername = user.display_username || user.username
  const basePath = `/studio/${baseUsername}`

  const navItems: NavItem[] = [
    {
      title: "Components",
      href: basePath,
      icon: <Layers className="mr-2 h-4 w-4" />,
    },
    {
      title: "Analytics",
      href: `${basePath}/analytics`,
      icon: <BarChartBig className="mr-2 h-4 w-4" />,
      disabled: true,
    },
    {
      title: "Monetization",
      href: `${basePath}/monetization`,
      icon: <CreditCard className="mr-2 h-4 w-4" />,
      disabled: true,
    },
  ]

  return (
    <div className="h-screen w-64 border-r flex flex-col overflow-y-auto bg-background">
      <div className="p-6 flex flex-col items-center border-b">
        <UserAvatar
          src={user.display_image_url || user.image_url || "/placeholder.svg"}
          alt={user.display_name || user.name || ""}
          size={64}
          className="mb-4"
        />
        <h2 className="text-xl font-medium text-center">
          {user.display_name || user.name || user.username}
        </h2>
        <p className="text-sm text-muted-foreground text-center">
          @{user.display_username || user.username}
        </p>
      </div>

      <div className="py-6 px-3 flex-1">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                item.disabled &&
                  "opacity-50 cursor-not-allowed pointer-events-none",
              )}
            >
              {item.icon}
              {item.title}
              {item.disabled && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  Soon
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t">
        <Link
          href="/settings/profile"
          className="block w-full px-3 py-2 text-sm text-center text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
        >
          Settings
        </Link>
      </div>
    </div>
  )
}
