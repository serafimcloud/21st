import { Metadata } from "next"
import { SettingsSidebar } from "@/components/features/settings/settings-sidebar"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences",
}

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <SettingsSidebar />
        </aside>
        <div className="flex justify-center w-full">
          <main className="flex w-full max-w-[640px] flex-col overflow-hidden pt-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
