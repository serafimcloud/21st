"use client"

import Link from "next/link"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { OnboardingServerWrapper } from "@/components/features/magic/get-started/onboarding-server-wrapper"
import { ApiKey } from "@/types/global"
import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GetStartedTabsProps {
  initialApiKey: ApiKey | null
  userId: string | null
}

export function GetStartedTabs({ initialApiKey, userId }: GetStartedTabsProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
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
                value="billing-usage"
                className="relative min-w-[120px] after:absolute after:inset-x-0 after:bottom-[-3px] after:-mb-px after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
              >
                Billing & Usage
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
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
            value="billing-usage"
            className="h-full mt-0 border-0 p-3 sm:p-6"
          >
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <h2 className="text-2xl font-bold">Manage Your Subscription</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Access your billing information, upgrade your plan, or manage
                your subscription settings.
              </p>
              <Button asChild size="lg" className="mt-4">
                <Link href="/settings/billing">Manage Subscription</Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
