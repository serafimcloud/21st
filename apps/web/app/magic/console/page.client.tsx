"use client"

import React, { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Link from "next/link"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Onboarding } from "@/components/features/magic/onboarding/onboarding-layout"
import { ApiKey } from "@/types/global"
import { MessageSquare } from "lucide-react"
interface ConsolePageClientProps {
  initialApiKey: ApiKey | null
  userId: string | null
}

export function ConsolePageClient({
  initialApiKey,
  userId,
}: ConsolePageClientProps) {
  const [apiKey, setApiKey] = useState<ApiKey | null>(initialApiKey)

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Header */}
      <header className="top-0 z-10 flex h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <Link
            href="/magic"
            className="flex items-center justify-center w-[22px] h-[22px] rounded-full bg-foreground hover:opacity-90 transition-opacity"
          />
          <div className="flex items-center gap-2">
            <Icons.slash className="text-border w-[22px] h-[22px] hidden sm:block" />
            <span className="text-[14px] font-medium hidden sm:inline-block">
              Magic
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link
            href="https://discord.gg/Qx4rFunHfm"
            target="_blank"
            className="gap-2 whitespace-nowrap"
          >
            <MessageSquare className="block sm:hidden h-4 w-4" />
            <span className="hidden sm:inline-block">Feedback</span>
          </Link>
        </Button>
      </header>

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
            <Onboarding apiKey={apiKey} setApiKey={setApiKey} userId={userId} />
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
                  Track your Magic usage and performance metrics. Coming soon...
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="billing"
            className="h-full mt-0 border-0 p-3 sm:p-6"
          >
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-center max-w-md px-4">
                <p className="text-base sm:text-lg font-medium">
                  Billing Management
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Manage your subscription and billing details. Coming soon...
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="invites"
            className="h-full mt-0 border-0 p-3 sm:p-6"
          >
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-center max-w-md px-4">
                <p className="text-base sm:text-lg font-medium">Team Invites</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Invite team members to collaborate with Magic. Coming soon...
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
