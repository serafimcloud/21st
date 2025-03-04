"use client"

import { useState } from "react"
import { Onboarding } from "./onboarding-layout"
import { ApiKey } from "@/types/global"

interface OnboardingServerWrapperProps {
  initialApiKey: ApiKey | null
  userId: string | null
}

export function OnboardingServerWrapper({
  initialApiKey,
  userId,
}: OnboardingServerWrapperProps) {
  const [apiKey, setApiKey] = useState<ApiKey | null>(initialApiKey)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    if (typeof window === "undefined") return true
    return !!localStorage.getItem("magic_onboarding_completed")
  })

  const handleOnboardingComplete = () => {
    localStorage.setItem("magic_onboarding_completed", "true")
    setHasCompletedOnboarding(true)
  }

  return (
    <Onboarding
      apiKey={apiKey}
      setApiKey={setApiKey}
      userId={userId}
      showWelcome={!hasCompletedOnboarding}
      onWelcomeComplete={handleOnboardingComplete}
    />
  )
}
