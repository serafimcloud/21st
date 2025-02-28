"use client"

import { OnboardingServerWrapper } from "@/components/features/magic/onboarding/onboarding-server-wrapper"
import { ApiKey } from "@/types/global"

interface GetStartedClientProps {
  initialApiKey: ApiKey | null
  userId: string | null
}

export function GetStartedClient({
  initialApiKey,
  userId,
}: GetStartedClientProps) {
  return (
    <div className="min-h-screen w-full bg-background antialiased mt-14">
      <div className="p-3 sm:p-6">
        <OnboardingServerWrapper
          initialApiKey={initialApiKey}
          userId={userId}
        />
      </div>
    </div>
  )
}
