import { Metadata } from "next"
import ProfileSettingsPage from "./page.client"

export const metadata: Metadata = {
  title: "Profile Settings",
  description: "Manage your profile settings and preferences.",
}

export default function SettingsProfilePage() {
  return (
    <>
      <div className="flex justify-between mb-4 gap-4">
        <div>
          <h2 className="text-sm font-medium">Profile</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage how others see you on the platform
          </p>
        </div>
      </div>
      <ProfileSettingsPage />
    </>
  )
}

