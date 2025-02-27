"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"
import { RefreshCw } from "lucide-react"
import { PlanType, PLAN_LIMITS } from "@/lib/subscription-limits"

interface PlanInfo {
  name: string
  type: PlanType
  period?: string | null
  periodEnd?: string | null
}

interface CurrentPlanCardProps {
  currentPlan: PlanInfo
  onManagePlan: () => void
  onRefresh?: () => void
}

export function CurrentPlanCard({
  currentPlan,
  onManagePlan,
  onRefresh,
}: CurrentPlanCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (!onRefresh) return

    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setTimeout(() => {
        setIsRefreshing(false)
      }, 1000)
    }
  }

  // Получаем информацию о плане из конфигурации
  const planInfo = PLAN_LIMITS[currentPlan.type] || PLAN_LIMITS.free
  const generationsLimit = planInfo.generationsPerMonth

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>{currentPlan.name}</CardTitle>
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span className="sr-only">Refresh plan data</span>
              </Button>
            )}
          </div>
          <Badge variant={currentPlan.type === "free" ? "outline" : "default"}>
            {currentPlan.type === "free"
              ? "Free"
              : currentPlan.type === "standard"
                ? "Standard"
                : "Pro"}
          </Badge>
        </div>
        <CardDescription>{planInfo.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center gap-4">
              <Icons.creditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Usage Limits</p>
                {currentPlan.type === "pro" ? (
                  <p className="text-sm text-muted-foreground">
                    {generationsLimit} generations per month
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {generationsLimit} generations per month
                  </p>
                )}
              </div>
            </div>
            {currentPlan.periodEnd && (
              <div className="flex items-center gap-4">
                <Icons.calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Expiration</p>
                  <p className="text-sm text-muted-foreground">
                    Active until{" "}
                    {new Date(currentPlan.periodEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onManagePlan}>
          {currentPlan.type === "free" ? "Subscribe Now" : "Manage Plan"}
        </Button>
      </CardFooter>
    </Card>
  )
}
