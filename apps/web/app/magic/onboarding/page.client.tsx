"use client"

import { useState, useEffect } from "react"
import { ApiKey } from "@/types/global"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useQuery } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "motion/react"

// Define the onboarding steps
export type OnboardingStep =
  | "welcome"
  | "select-ide"
  | "install-ide"
  | "create-component"
  | "upgrade-pro"
  | "troubleshooting"

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
const TroubleshootingStep = dynamic(
  () =>
    import(
      "@/components/features/magic/onboarding/steps/troubleshooting-step"
    ).then((mod) => mod.TroubleshootingStep),
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
    "troubleshooting",
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

  // Handle skipping onboarding
  const skipOnboarding = () => {
    router.push("/magic/console")
  }

  // Render the current step
  const renderCurrentStep = () => {
    switch (onboardingState.currentStep) {
      case "welcome":
        return (
          <WelcomeStep
            onComplete={() => {
              completeStep("welcome", "select-ide")
            }}
            isAuthenticated={!!userId}
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
            onComplete={(action) => {
              if (action === "troubleshooting") {
                router.push(
                  "/magic/onboarding?step=troubleshooting&from=install-ide",
                  {
                    scroll: false,
                  },
                )
                setOnboardingState((prev) => ({
                  ...prev,
                  currentStep: "troubleshooting",
                }))
              } else {
                completeStep("install-ide", "create-component")
              }
            }}
          />
        )
      case "troubleshooting":
        return (
          <TroubleshootingStep
            selectedIde={onboardingState.selectedIde || "cursor"}
            osType={onboardingState.osType}
            previousStep={
              (searchParams.get("from") as OnboardingStep) || "install-ide"
            }
            onComplete={(returnToStep) => {
              router.push(`/magic/onboarding?step=${returnToStep}`, {
                scroll: false,
              })
              setOnboardingState((prev) => ({
                ...prev,
                currentStep: returnToStep,
              }))
            }}
          />
        )
      case "create-component":
        return (
          <CreateComponentStep
            hasCreatedComponent={!!hasCreatedComponent}
            onComplete={(action) => {
              if (action === "troubleshooting") {
                router.push(
                  "/magic/onboarding?step=troubleshooting&from=create-component",
                  {
                    scroll: false,
                  },
                )
                setOnboardingState((prev) => ({
                  ...prev,
                  currentStep: "troubleshooting",
                }))
              } else {
                completeStep("create-component", "upgrade-pro")
              }
            }}
          />
        )
      case "upgrade-pro":
        return (
          <UpgradeProStep
            apiKey={apiKey}
            onComplete={() => {
              const upgradePro: OnboardingStep = "upgrade-pro"
              // Save completed state to localStorage with current step unchanged
              const updatedState = {
                ...onboardingState,
                completedSteps: [
                  ...new Set([...onboardingState.completedSteps, upgradePro]),
                ],
              }
              localStorage.setItem(
                ONBOARDING_STATE_KEY,
                JSON.stringify(updatedState),
              )
              // Redirect to console
              router.push("/magic/console")
            }}
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
    <div className="min-h-screen w-full bg-background antialiased relative flex items-center">
      <div className="absolute inset-0 pointer-events-none bg-grid-purple" />
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={skipOnboarding}
        >
          Skip onboarding
        </Button>
      </div>
      <div className="p-3 sm:p-6 w-full z-10">
        <div className="w-full max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={onboardingState.currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
