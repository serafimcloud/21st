"use client"

import { useState, useEffect } from "react"
import { Onboarding } from "./onboarding-layout"
import { ApiKey } from "@/types/global"
import { useClerkSupabaseClient } from "@/lib/clerk"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle } from "lucide-react"
import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"

// Create an atom with storage for tracking if Magic onboarding is completed
export const magicOnboardingCompletedAtom = atomWithStorage<boolean>(
  "magic_agent_used",
  false,
)

// Custom hook to manage the Magic onboarding state
export function useMagicOnboardingState(userId: string | null) {
  const supabase = useClerkSupabaseClient()
  const [magicOnboardingCompleted, setMagicOnboardingCompleted] = useAtom(
    magicOnboardingCompletedAtom,
  )
  // Only query the database if we don't already know the user has completed onboarding
  const { data: hasGenerationRequests } = useQuery({
    queryKey: ["hasGenerationRequests", userId],
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

      const hasRequests = data && data.length > 0

      if (hasRequests) {
        // Update the atom (which will automatically update localStorage)
        setMagicOnboardingCompleted(true)
      }

      return hasRequests
    },
    enabled: !!userId && !magicOnboardingCompleted, // Only run if we don't already know
    staleTime: Infinity, // This data doesn't change during a session
    gcTime: Infinity, // Keep the data in cache indefinitely
  })

  return {
    magicOnboardingCompleted:
      magicOnboardingCompleted || !!hasGenerationRequests,
  }
}

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

  // Use our custom hook to manage the onboarding state
  const { magicOnboardingCompleted } = useMagicOnboardingState(userId)

  const handleOnboardingComplete = () => {
    localStorage.setItem("magic_onboarding_completed", "true")
    setHasCompletedOnboarding(true)
  }

  return (
    <div className="space-y-6">
      {magicOnboardingCompleted && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-green-800 dark:text-green-400">
                All Steps Completed!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                You've already used Magic and completed all the necessary steps.
                You can continue working with Magic in the console.
              </p>
              <Button asChild className="mt-3" size="sm">
                <Link href="/magic/console">
                  Go to Console <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      <Onboarding
        apiKey={apiKey}
        setApiKey={setApiKey}
        userId={userId}
        showWelcome={!hasCompletedOnboarding}
        onWelcomeComplete={handleOnboardingComplete}
        allStepsCompleted={magicOnboardingCompleted}
      />
    </div>
  )
}
