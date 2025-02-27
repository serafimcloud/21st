import { auth } from "@clerk/nextjs/server"
import {
  BillingSettingsClient,
  AllPlansButton,
} from "@/components/features/settings/billing/billing-settings-client"
import PricingTrigger from "@/components/features/settings/billing/pricing-trigger"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { PLAN_LIMITS, PlanType } from "@/lib/subscription-limits"
import { supabaseWithAdminAccess } from "@/lib/supabase"

// Определяем тип для данных о подписке пользователя
interface PlanInfo {
  name: string
  type: "free" | "standard" | "pro"
  period?: string | null
  periodEnd?: string | null
  usage_count?: number
  current_period_end?: string
  cancel_at_period_end?: boolean
  portal_url?: string
}

interface PlanData {
  name: string
  type: "free" | "standard" | "pro"
  period?: string | null
}

interface UserPlanData {
  status: string
  plans?: PlanData
  meta?: Record<string, any>
}

async function getCurrentPlan(userId: string | null): Promise<PlanInfo> {
  // Дефолтные данные, которые будут возвращены в случае ошибки
  const defaultPlanInfo: PlanInfo = {
    name: PLAN_LIMITS.free.displayName,
    type: "free",
    usage_count: 0,
    current_period_end: undefined,
    cancel_at_period_end: false,
    portal_url: undefined,
  }

  if (!userId) {
    return defaultPlanInfo
  }

  try {
    // Напрямую получаем информацию о подписке пользователя из базы данных
    // Убираем .single() и используем .maybeSingle() чтобы избежать ошибки отсутствия результата
    const { data: userPlan, error } = await supabaseWithAdminAccess
      .from("users_to_plans")
      .select(
        `
        status,
        plans (
          id,
          name,
          type,
          period
        ),
        meta
      `,
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle()

    // Если нет данных или произошла ошибка, возвращаем дефолтный план (Free)
    if (error || !userPlan) {
      console.log("User has no active subscription, returning free plan")
      return defaultPlanInfo
    }

    // Типизируем полученные данные
    const typedUserPlan = userPlan as unknown as UserPlanData

    // Получаем статистику использования (если доступно)
    const usageCount = typedUserPlan.meta?.usage_count || 0

    // Определяем URL портала Stripe (если доступно)
    let portalUrl = typedUserPlan.meta?.portal_url || null

    // Проверяем тип плана из базы данных
    const planType = typedUserPlan.plans?.type as PlanType

    // Формируем информацию о плане
    const planInfo: PlanInfo = {
      ...defaultPlanInfo,
      name:
        PLAN_LIMITS[planType]?.displayName ||
        typedUserPlan.plans?.name ||
        defaultPlanInfo.name,
      type: planType && PLAN_LIMITS[planType] ? planType : "free",
      period: typedUserPlan.plans?.period || null,
      periodEnd: typedUserPlan.meta?.period_end || null,
      current_period_end: typedUserPlan.meta?.current_period_end || null,
      cancel_at_period_end: typedUserPlan.meta?.cancel_at_period_end || false,
      usage_count: usageCount,
      portal_url: portalUrl,
    }

    return planInfo
  } catch (error) {
    console.error("Error fetching plan data:", error)
    return defaultPlanInfo
  }
}

export default async function BillingSettingsPage() {
  const { userId } = await auth()
  const subscription = await getCurrentPlan(userId)

  return (
    <div className="container pb-10">
      <div className="space-y-6">
        {/* Header - будет скрыт внутри компонента, когда отображается таблица планов */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-sm font-medium">Billing</h2>
            <p className="text-xs text-muted-foreground mt-1">
              For questions about billing,{" "}
              <a
                href="mailto:support@21st.dev"
                className="underline hover:text-primary"
              >
                contact us
              </a>
            </p>
          </div>
          <PricingTrigger />
        </div>

        {/* Client Component with subscription data */}
        <BillingSettingsClient subscription={subscription} />
      </div>
    </div>
  )
}
