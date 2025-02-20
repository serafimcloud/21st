"use client"

import { ApiKeySection } from "./api-key-section"
import { IdeInstructions } from "./ide-instructions"
import { ApiKey } from "@/types/global"
import { cn } from "@/lib/utils"
import { Check, Circle } from "lucide-react"

interface OnboardingProps {
  apiKey: ApiKey | null
  setApiKey: (key: ApiKey | null) => void
  userId: string | null
}

export function Onboarding({ apiKey, setApiKey, userId }: OnboardingProps) {
  const steps = [
    {
      id: "api-key",
      title: "Add an API Key",
      description: "Use the following generated key to authenticate requests",
      isCompleted: !!apiKey,
      content: (
        <ApiKeySection apiKey={apiKey} setApiKey={setApiKey} userId={userId} />
      ),
    },
    {
      id: "ide-setup",
      title: "Setup your IDE",
      description: "Install Magic in your preferred IDE",
      isCompleted: false,
      content: <IdeInstructions apiKey={apiKey} />,
    },
    {
      id: "first-component",
      title: "Create your first component",
      description: "Try creating your first UI component with Magic",
      isCompleted: false,
      content: (
        <div className="flex min-h-[100px] max-w-[650px] items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">Coming soon...</p>
        </div>
      ),
    },
  ]

  return (
    <div className="relative">
      <div className="mx-auto max-w-[1200px]">
        <div className="border-b pb-4 mb-8">
          <h1 className="text-[32px] font-semibold">Onboarding</h1>
        </div>
        <div className="relative">
          <div className="absolute left-[15px] top-[40px] bottom-0 w-[2px] bg-border" />
          <div className="space-y-12">
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
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold leading-none tracking-tight">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    </div>
                    <div>{step.content}</div>
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
