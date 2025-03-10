"use client"

import { ApiKeySection } from "./api-key-section"
import { IdeInstructions } from "./ide-instructions"
import { WelcomeOnboarding } from "./welcome-onboarding"
import { ApiKey } from "@/types/global"
import { cn } from "@/lib/utils"
import { Check, Circle } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface OnboardingProps {
  apiKey: ApiKey | null
  setApiKey: (key: ApiKey | null) => void
  userId: string | null
  showWelcome?: boolean
  onWelcomeComplete?: () => void
  allStepsCompleted?: boolean
}

export function Onboarding({
  apiKey,
  setApiKey,
  userId,
  showWelcome = true,
  onWelcomeComplete,
  allStepsCompleted = false,
}: OnboardingProps) {
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(showWelcome)
  const [selectedOS, setSelectedOS] = useState<"windows" | "mac">("mac")

  useEffect(() => {
    // Detect OS on mount
    const userAgent = window.navigator.userAgent.toLowerCase()
    setSelectedOS(userAgent.includes("windows") ? "windows" : "mac")
  }, [])

  useEffect(() => {
    setShowWelcomeDialog(showWelcome)
  }, [showWelcome])

  const handleWelcomeComplete = () => {
    setShowWelcomeDialog(false)
    onWelcomeComplete?.()
  }

  const steps = [
    {
      id: "api-key",
      title: "Add an API Key",
      description: "Use the following generated key to authenticate requests",
      isCompleted: !!apiKey || allStepsCompleted,
      content: (
        <ApiKeySection apiKey={apiKey} setApiKey={setApiKey} userId={userId} />
      ),
    },
    {
      id: "ide-setup",
      title: (
        <div className="flex items-center gap-4">
          <span>Setup your IDE</span>
          <div className="flex items-center gap-2 text-sm">
            <Tabs
              defaultValue="mac"
              onValueChange={(value) =>
                setSelectedOS(value as "mac" | "windows")
              }
            >
              <TabsList className="rounded-md h-7 p-0.5">
                <TabsTrigger value="mac" className="text-xs h-6">
                  macOS
                </TabsTrigger>
                <TabsTrigger value="windows" className="text-xs h-6">
                  Windows
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      ),
      description: "Install Magic in your preferred IDE",
      isCompleted: allStepsCompleted,
      content: <IdeInstructions apiKey={apiKey} selectedOS={selectedOS} />,
    },
    {
      id: "first-component",
      title: "Create your first component",
      description: "Try creating your first UI component with Magic",
      isCompleted: allStepsCompleted,
      content: (
        <div className="space-y-6 max-w-[650px]">
          {/* Step 1 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
              1
            </div>
            <div className="space-y-3 flex-1">
              <h3 className="font-medium">Tell Agent What You Need</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  In your AI Agent's chat, type /ui and describe the component
                  you want to create
                </p>
                <div className="relative w-full aspect-[21/5] rounded-md overflow-hidden">
                  <Image
                    src="/how-it-works-1.png"
                    alt="Tell agent what you need"
                    fill
                    className="object-cover object-left-top mix-blend-difference"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
              2
            </div>
            <div className="space-y-3 flex-1">
              <h3 className="font-medium">Let Magic Create It</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  When prompted in Cursor, use Magic to instantly build your
                  polished UI component
                </p>
                <div className="relative w-full aspect-[21/5] rounded-md overflow-hidden">
                  <Image
                    src="/how-it-works-3.png"
                    alt="Let Magic create it"
                    fill
                    className="object-cover object-left-top mix-blend-difference"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="relative">
      <div className="mx-auto max-w-[1200px] px-2 sm:px-4">
        <div className="border-b pb-4 mb-4">
          <h1 className="font-semibold tracking-tight">Get Started</h1>
          {showWelcomeDialog && (
            <WelcomeOnboarding
              onComplete={handleWelcomeComplete}
              autoOpen={true}
            />
          )}
        </div>
        <div className="relative">
          <div className="absolute left-[15px] top-[40px] bottom-0 w-[2px] bg-border" />
          <div className="space-y-8 sm:space-y-12">
            {steps.map((step) => (
              <div key={step.id} className="relative">
                <div className="flex gap-4">
                  <div
                    className={cn(
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                      step.isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/20 bg-background",
                    )}
                  >
                    {step.isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Circle className="h-3 w-3" fill="currentColor" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 max-w-[650px]">
                    <div className="space-y-2 mb-4">
                      <h3 className="text-base sm:text-lg font-semibold leading-tight sm:leading-none tracking-tight">
                        {step.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                    <div className="w-full overflow-hidden">
                      <div className="max-w-full overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
                        {step.content}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
