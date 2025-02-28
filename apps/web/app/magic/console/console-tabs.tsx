"use client"

import Link from "next/link"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { OnboardingServerWrapper } from "@/components/features/magic/onboarding/onboarding-server-wrapper"
import { ConsoleHeader } from "./console-header"
import { WaitlistGate } from "./waitlist-gate"
import { ApiKey } from "@/types/global"
import { ArrowUpRight } from "lucide-react"

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
                <Link href="/settings/billing" aria-disabled="true" className="pointer-events-none opacity-50">
                  <TabsTrigger
                    value="billing-usage"
                    className="relative min-w-[120px] after:absolute after:inset-x-0 after:bottom-[-3px] after:-mb-px after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                  >
                    Billing & Usage 
                    <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </TabsTrigger>
                </Link>
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
          </Tabs>
        </div>
      </div>
    </WaitlistGate>
  )
}
