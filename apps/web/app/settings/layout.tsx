import { type Metadata } from "next/types"
import { SettingsMobileNav } from "@/components/features/settings/settings-mobile-nav"
import { SettingsSidebar } from "@/components/features/settings/settings-sidebar"

interface SettingsLayoutProps {
  children: React.ReactNode
}

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences.",
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="container max-w-screen-xl mx-auto px-0 sm:px-4">
      <div className="block sm:hidden">
        <SettingsMobileNav />
      </div>
      <div className="mt-[73px] sm:mt-0">
        <div className="flex min-h-screen flex-col">
          <div className="container flex-1 items-start px-4 sm:px-4 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
            <aside className="fixed top-4 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
              <SettingsSidebar />
            </aside>
            <main className="flex w-full max-w-[640px] flex-col overflow-hidden pt-0 sm:pt-6 mx-auto">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
