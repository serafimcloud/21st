"use client"

import { useState, useEffect, useRef } from "react"
import { ApiKey } from "@/types/global"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useQuery } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import { useAuth } from "@clerk/nextjs"

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

// Helper to safely interact with localStorage
const safeStorage = {
  isAvailable: () => {
    try {
      const testKey = "test_storage"
      localStorage.setItem(testKey, testKey)
      localStorage.removeItem(testKey)
      return true
    } catch (e) {
      return false
    }
  },
  getItem: (key: string): string | null => {
    try {
      if (!safeStorage.isAvailable()) return null
      return localStorage.getItem(key)
    } catch (e) {
      console.error("Failed to get item from localStorage:", e)
      return null
    }
  },
  setItem: (key: string, value: string): boolean => {
    try {
      if (!safeStorage.isAvailable()) return false
      localStorage.setItem(key, value)
      return true
    } catch (e) {
      console.error("Failed to set item in localStorage:", e)
      return false
    }
  },
  removeItem: (key: string): boolean => {
    try {
      if (!safeStorage.isAvailable()) return false
      localStorage.removeItem(key)
      return true
    } catch (e) {
      console.error("Failed to remove item from localStorage:", e)
      return false
    }
  },
}

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
  userId: initialUserId,
}: OnboardingClientProps) {
  const [apiKey, setApiKey] = useState<ApiKey | null>(initialApiKey)
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(
    defaultOnboardingState,
  )
  const [isCreatingApiKey, setIsCreatingApiKey] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [detectedOs, setDetectedOs] = useState<OsType>("mac")
  const { userId: clerkUserId, isLoaded: isAuthLoaded } = useAuth()

  const currentUserId = clerkUserId || initialUserId
  const initRef = useRef(false)

  const supabase = useClerkSupabaseClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Detect OS once on mount
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    let os: OsType = "mac"

    if (userAgent.includes("windows")) {
      os = "windows"
    } else if (userAgent.includes("linux")) {
      os = "linux"
    }

    setDetectedOs(os)
  }, [])

  // Handle authentication changes
  useEffect(() => {
    if (!isAuthLoaded) return

    // If no user is authenticated, clear localStorage to prevent state leakage
    if (!currentUserId) {
      safeStorage.removeItem(ONBOARDING_STATE_KEY)
      setOnboardingState((prev) => ({
        ...defaultOnboardingState,
        osType: prev.osType, // Preserve OS detection
      }))
    }

    // Initialize state after auth is loaded
    if (!initRef.current) {
      initializeState()
      initRef.current = true
    }

    // Cleanup function
    return () => {
      initRef.current = false
    }
  }, [currentUserId, isAuthLoaded])

  // Initialize state from localStorage and URL
  const initializeState = () => {
    // Check URL params for step
    const stepParam = searchParams.get("step") as OnboardingStep | null

    // Get stored state from localStorage (only if user is authenticated)
    let parsedState: OnboardingState | null = null

    if (currentUserId) {
      const savedState = safeStorage.getItem(ONBOARDING_STATE_KEY)

      if (savedState) {
        try {
          parsedState = JSON.parse(savedState) as OnboardingState
        } catch (e) {
          console.error("Failed to parse onboarding state:", e)
        }
      }
    }

    // If we have a valid step in URL, use it
    if (stepParam && VALID_STEPS.includes(stepParam)) {
      const baseState = parsedState || defaultOnboardingState

      const newState = {
        ...baseState,
        osType: detectedOs,
        currentStep: stepParam,
      }

      setOnboardingState(newState)

      if (currentUserId) {
        safeStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(newState))
      }
    } else if (parsedState) {
      // Use parsed state
      setOnboardingState({
        ...parsedState,
        osType: detectedOs,
      })
    } else {
      // Use default state
      setOnboardingState({
        ...defaultOnboardingState,
        osType: detectedOs,
      })
    }

    setIsInitialized(true)
  }

  // Define valid steps array
  const VALID_STEPS = [
    "welcome",
    "select-ide",
    "install-ide",
    "troubleshooting",
    "create-component",
    "upgrade-pro",
  ] as const

  // Re-initialize when URL changes
  useEffect(() => {
    if (isInitialized && isAuthLoaded) {
      initializeState()
    }
  }, [searchParams])

  // Save onboarding state to localStorage whenever it changes
  useEffect(() => {
    if (!isInitialized || !currentUserId) return

    safeStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(onboardingState))
  }, [onboardingState, currentUserId, isInitialized])

  // Check if user has created components
  const { data: hasCreatedComponent } = useQuery({
    queryKey: ["hasCreatedComponent", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return false

      const { data, error } = await supabase
        .from("mcp_generation_requests")
        .select("id")
        .eq("user_id", currentUserId)
        .limit(1)

      if (error) {
        console.error("Error checking generation requests:", error)
        return false
      }

      return data && data.length > 0
    },
    enabled: !!currentUserId && isInitialized,
    refetchInterval: 5000, // Check every 5 seconds
  })

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

  // Create an API key for a user
  const createApiKeyForUser = async (id: string) => {
    if (!id || isCreatingApiKey) return null

    setIsCreatingApiKey(true)
    try {
      const { data, error } = await supabase.rpc("create_api_key", {
        user_id: id,
        plan: "free",
        requests_limit: 100,
      })

      if (error) {
        console.error("Failed to create API key:", error)
        toast.error(`Failed to create API key: ${error.message}`)
        return null
      }

      if (!data || !data.key) {
        toast.error("No API key data returned")
        return null
      }

      const newKey: ApiKey = {
        id: data.id,
        key: data.key,
        user_id: data.user_id,
        plan: data.plan || "free",
        requests_limit: data.requests_limit || 100,
        requests_count: data.requests_count || 0,
        created_at: data.created_at || new Date().toISOString(),
        expires_at: data.expires_at,
        last_used_at: data.last_used_at,
        is_active: data.is_active ?? true,
        project_url: "https://21st.dev/magic",
      }

      setApiKey(newKey)
      return newKey
    } catch (err) {
      console.error("Unexpected error creating API key:", err)
      toast.error("An unexpected error occurred")
      return null
    } finally {
      setIsCreatingApiKey(false)
    }
  }

  // Don't render until auth is loaded
  if (!isAuthLoaded) {
    return null
  }

  // Render the current step
  const renderCurrentStep = () => {
    switch (onboardingState.currentStep) {
      case "welcome":
        return (
          <WelcomeStep
            onComplete={async () => {
              // Generate API key when welcome step is completed (if user is authenticated and doesn't have one)
              if (currentUserId && !apiKey) {
                const createdKey = await createApiKeyForUser(currentUserId)
                if (!createdKey) {
                  // If the API key creation fails, show an error but allow to continue
                  toast.error(
                    "API key generation failed. You can try again in the next step.",
                  )
                }
              }
              completeStep("welcome", "select-ide")
            }}
            isAuthenticated={!!currentUserId}
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
            onGenerateApiKey={async () => {
              if (currentUserId) {
                const createdKey = await createApiKeyForUser(currentUserId)
                if (createdKey) {
                  toast.success("API key generated successfully!")
                }
              } else {
                toast.error("You must be signed in to generate an API key")
              }
            }}
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
              safeStorage.setItem(
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
      <div className="absolute top-4 right-4 z-20">
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
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
              transition={{
                duration: 0.5,
                ease: [0.23, 1, 0.32, 1],
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
