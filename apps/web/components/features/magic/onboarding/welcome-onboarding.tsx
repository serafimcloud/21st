"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface WelcomeOnboardingProps {
  onComplete?: () => void
  steps?: OnboardingStep[]
  autoOpen?: boolean
}

interface OnboardingStep {
  title: string
  description: string
}

const defaultSteps: OnboardingStep[] = [
  {
    title: "Welcome to Magic Agent Beta",
    description:
      "Thank you for joining Magic Agent! During the beta period, all features are completely free. We're excited to have you on board!",
  },
  {
    title: "Help Us Improve",
    description:
      "Please click the 'Feedback' button in the top right corner to join our Discord community. Your feedback is invaluable in making Magic Agent better.",
  },
  {
    title: "Get Started",
    description:
      "Now, let's set up Magic Agent! Follow the installation instructions below to start creating amazing UI components.",
  },
]

export function WelcomeOnboarding({
  onComplete,
  steps = defaultSteps,
  autoOpen = false,
}: WelcomeOnboardingProps) {
  const [currentStep, setCurrentStep] = React.useState(1)
  const [open, setOpen] = React.useState(autoOpen)
  const totalSteps = steps.length
  const currentStepData = steps[currentStep - 1]

  React.useEffect(() => {
    setOpen(autoOpen)
  }, [autoOpen])

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    setOpen(false)
    onComplete?.()
  }

  const handleSkip = () => {
    handleComplete()
  }

  if (!currentStepData) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] gap-0 p-0">
        <div className="space-y-6 px-6 py-6">
          <DialogHeader>
            <DialogTitle>{currentStepData.title}</DialogTitle>
            <DialogDescription>{currentStepData.description}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex justify-center space-x-1.5">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full bg-primary transition-opacity",
                    index + 1 === currentStep ? "opacity-100" : "opacity-20",
                  )}
                />
              ))}
            </div>

            <DialogFooter className="sm:justify-start">
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
                className="text-sm"
              >
                Skip
              </Button>
              <Button type="button" className="group" onClick={handleNext}>
                {currentStep === totalSteps ? "Get Started" : "Next"}
                {currentStep !== totalSteps && (
                  <ArrowRight
                    className="ml-2 h-4 w-4 opacity-70 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                )}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
