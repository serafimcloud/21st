"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { OnboardingServerWrapper } from "@/components/features/magic/onboarding/onboarding-server-wrapper"
import { ConsoleHeader } from "./console-header"
import { WaitlistGate } from "./waitlist-gate"
import { ApiKey } from "@/types/global"

interface ConsoleTabsProps {
  initialApiKey: ApiKey | null
  userId: string | null
}

export function ConsoleTabs({ initialApiKey, userId }: ConsoleTabsProps) {
  return (
    <WaitlistGate>
      <div className="flex min-h-screen w-full flex-col bg-background">
        {/* Header */}
        <ConsoleHeader />

        {/* Main Content */}
        <div className="flex-1">
          <Tabs defaultValue="onboarding" className="h-full">
            <div className="border-b overflow-x-auto">
              <TabsList className="h-auto gap-4 sm:gap-6 rounded-none bg-transparent px-2 sm:px-4 py-1 text-foreground flex-nowrap">
                <TabsTrigger
                  value="onboarding"
                  className="relative min-w-[80px] after:absolute after:inset-x-0 after:bottom-[-3px] after:-mb-px after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                >
                  Onboarding
                </TabsTrigger>
                <TabsTrigger
                  value="usage"
                  className="relative min-w-[60px] after:absolute after:inset-x-0 after:bottom-[-3px] after:-mb-px after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                >
                  Usage
                </TabsTrigger>
                <TabsTrigger
                  value="billing"
                  className="relative min-w-[60px] after:absolute after:inset-x-0 after:bottom-[-3px] after:-mb-px after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                >
                  Billing
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="onboarding"
              className="h-full mt-0 border-0 p-3 sm:p-6"
            >
              <OnboardingServerWrapper
                initialApiKey={initialApiKey}
                userId={userId}
              />
            </TabsContent>

            <TabsContent
              value="usage"
              className="h-full mt-0 border-0 p-3 sm:p-6"
            >
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-center max-w-md px-4">
                  <p className="text-base sm:text-lg font-medium">
                    Usage Statistics
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Track your Magic usage and performance metrics. Coming
                    soon...
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </WaitlistGate>
  )
}
