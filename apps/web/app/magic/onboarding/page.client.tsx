"use client"

import { useState, useEffect } from "react"
import { ApiKey } from "@/types/global"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useQuery } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"

// Define the onboarding steps
export type OnboardingStep =
  | "welcome"
  | "select-ide"
  | "install-ide"
  | "create-component"
  | "upgrade-pro"

// Define the IDE options
export type IdeOption = "cursor" | "cline" | "windsurf"

// Define the OS options
export type OsType = "mac" | "windows" | "linux"

// Define the onboarding state that will be stored in localStorage
export interface OnboardingState {
  currentStep: OnboardingStep
  selectedIde: IdeOption | null
  osType: OsType
  completedSteps: OnboardingStep[]
}

// Define the default onboarding state
const defaultOnboardingState: OnboardingState = {
  currentStep: "welcome",
  selectedIde: null,
  osType: "mac", // Default, will be detected
  completedSteps: [],
}

// Local storage key
const ONBOARDING_STATE_KEY = "magic_onboarding_state"

interface OnboardingClientProps {
  initialApiKey: ApiKey | null
  userId: string | null
}

// Dynamically import step components
const WelcomeStep = dynamic(
  () =>
    import("@/components/features/magic/onboarding/steps/welcome-step").then(
      (mod) => mod.WelcomeStep,
    ),
  { ssr: false },
)
const SelectIdeStep = dynamic(
  () =>
    import("@/components/features/magic/onboarding/steps/select-ide-step").then(
      (mod) => mod.SelectIdeStep,
    ),
  { ssr: false },
)
const InstallIdeStep = dynamic(
  () =>
    import(
      "@/components/features/magic/onboarding/steps/install-ide-step"
    ).then((mod) => mod.InstallIdeStep),
  { ssr: false },
)
const CreateComponentStep = dynamic(
  () =>
    import(
      "@/components/features/magic/onboarding/steps/create-component-step"
    ).then((mod) => mod.CreateComponentStep),
  { ssr: false },
)
const UpgradeProStep = dynamic(
  () =>
    import(
      "@/components/features/magic/onboarding/steps/upgrade-pro-step"
    ).then((mod) => mod.UpgradeProStep),
  { ssr: false },
)

export function OnboardingClient({
  initialApiKey,
  userId,
}: OnboardingClientProps) {
  const [apiKey, setApiKey] = useState<ApiKey | null>(initialApiKey)
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(
    defaultOnboardingState,
  )
  const supabase = useClerkSupabaseClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if user has created components
  const { data: hasCreatedComponent } = useQuery({
    queryKey: ["hasCreatedComponent", userId],
    queryFn: async () => {
      if (!userId) return false

      const { data, error } = await supabase
        .from("mcp_generation_requests")
        .select("id")
        .eq("user_id", userId)
        .limit(1)

      if (error) {
        console.error("Error checking generation requests:", error)
        return false
      }

      return data && data.length > 0
    },
    enabled: !!userId,
    refetchInterval: 5000, // Check every 5 seconds
  })

  // Define valid steps array
  const VALID_STEPS = [
    "welcome",
    "select-ide",
    "install-ide",
    "create-component",
    "upgrade-pro",
  ] as const

  // Initialize onboarding state from localStorage and URL params
  useEffect(() => {
    // Detect OS
    const userAgent = window.navigator.userAgent.toLowerCase()
    let detectedOs: OsType = "mac"

    if (userAgent.includes("windows")) {
      detectedOs = "windows"
    } else if (userAgent.includes("linux")) {
      detectedOs = "linux"
    }

    // Check URL params for step
    const stepParam = searchParams.get("step") as OnboardingStep | null

    // If we have a valid step in URL, use it as the base for state
    if (stepParam && VALID_STEPS.includes(stepParam)) {
      const savedState = localStorage.getItem(ONBOARDING_STATE_KEY)
      let baseState: OnboardingState

      try {
        baseState = savedState ? JSON.parse(savedState) : defaultOnboardingState
      } catch (e) {
        baseState = defaultOnboardingState
      }

      const newState = {
        ...baseState,
        osType: detectedOs,
        currentStep: stepParam,
      }

      setOnboardingState(newState)
      localStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(newState))
      return
    }

    // If no valid URL param, fall back to localStorage
    const savedState = localStorage.getItem(ONBOARDING_STATE_KEY)
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState) as OnboardingState
        setOnboardingState({
          ...parsedState,
          osType: detectedOs,
        })
      } catch (e) {
        setOnboardingState({
          ...defaultOnboardingState,
          osType: detectedOs,
        })
      }
    } else {
      setOnboardingState({
        ...defaultOnboardingState,
        osType: detectedOs,
      })
    }
  }, [searchParams])

  // Save onboarding state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(onboardingState))
  }, [onboardingState])

  // Handle step completion
  const completeStep = (step: OnboardingStep, nextStep: OnboardingStep) => {
    // Update URL first to avoid race conditions
    router.push(`/magic/onboarding?step=${nextStep}`, { scroll: false })

    setOnboardingState((prev) => ({
      ...prev,
      currentStep: nextStep,
      completedSteps: [...new Set([...prev.completedSteps, step])],
    }))
  }

  // Handle IDE selection
  const selectIde = (ide: IdeOption) => {
    setOnboardingState((prev) => ({
      ...prev,
      selectedIde: ide,
    }))
  }

  // Render the current step
  const renderCurrentStep = () => {
    switch (onboardingState.currentStep) {
      case "welcome":
        return (
          <WelcomeStep
            onComplete={() => completeStep("welcome", "select-ide")}
          />
        )
      case "select-ide":
        return (
          <SelectIdeStep
            onSelect={(ide: IdeOption) => {
              selectIde(ide)
              completeStep("select-ide", "install-ide")
            }}
          />
        )
      case "install-ide":
        return (
          <InstallIdeStep
            apiKey={apiKey}
            selectedIde={onboardingState.selectedIde || "cursor"}
            osType={onboardingState.osType}
            onComplete={() => completeStep("install-ide", "create-component")}
          />
        )
      case "create-component":
        return (
          <CreateComponentStep
            hasCreatedComponent={!!hasCreatedComponent}
            onComplete={() => completeStep("create-component", "upgrade-pro")}
          />
        )
      case "upgrade-pro":
        return (
          <UpgradeProStep
            apiKey={apiKey}
            onComplete={() => completeStep("upgrade-pro", "welcome")} // Cycle back to welcome if needed
          />
        )
      default:
        return (
          <WelcomeStep
            onComplete={() => completeStep("welcome", "select-ide")}
          />
        )
    }
  }

  return (
    <div className="min-h-screen w-full bg-background antialiased mt-14">
      <div className="p-3 sm:p-6">
        <div className="w-full max-w-4xl mx-auto">{renderCurrentStep()}</div>
      </div>
    </div>
  )
}
