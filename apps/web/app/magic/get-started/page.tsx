import { auth } from "@clerk/nextjs/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { GetStartedClient } from "./page.client"
import { Header } from "@/components/ui/header.client"
import { Logo } from "@/components/ui/logo"
import { Footer } from "@/components/ui/footer"
import { PlanInfo } from "@/app/settings/billing/page"
import { PLAN_LIMITS, PlanType } from "@/lib/config/subscription-plans"

async function getApiKey(userId: string) {
  const supabase = supabaseWithAdminAccess
  const { data: rawApiKey } = await supabase
    .from("api_keys")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single()

  if (!rawApiKey) return null

  return {
    id: rawApiKey.id,
    key: rawApiKey.key,
    user_id: rawApiKey.user_id,
    plan: rawApiKey.plan || "free",
    requests_limit: rawApiKey.requests_limit || 100,
    requests_count: rawApiKey.requests_count || 0,
    created_at: rawApiKey.created_at || new Date().toISOString(),
    expires_at: rawApiKey.expires_at,
    last_used_at: rawApiKey.last_used_at,
    is_active: rawApiKey.is_active ?? true,
    project_url: rawApiKey.project_url || "https://21st.dev/magic",
  }
}

/**
 * Получает текущую информацию о плане и лимитах пользователя
 */
async function getCurrentPlan(userId: string | null): Promise<PlanInfo> {
  // Данные плана по умолчанию
  const defaultPlanInfo: PlanInfo = {
    name: PLAN_LIMITS.free.displayName,
    type: "free",
    usage: 0,
    limit: PLAN_LIMITS.free.generationsPerMonth,
    current_period_end: undefined,
    cancel_at_period_end: false,
    portal_url: undefined,
  }

  if (!userId) {
    return defaultPlanInfo
  }

  try {
    // 1. Получаем активную подписку пользователя
    const { data: userPlan, error: planError } = await supabaseWithAdminAccess
      .from("users_to_plans")
      .select(
        `
        id,
        status,
        plan_id,
        meta,
        last_paid_at,
        plans:plan_id (
          id,
          stripe_plan_id,
          price,
          env,
          period,
          type,
          add_usage
        )
      `,
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle()

    // 2. Получаем информацию об использовании
    const { data: usageData, error: usageError } = await supabaseWithAdminAccess
      .from("usages")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    // Если произошла ошибка при запросе плана, возвращаем план по умолчанию
    if (planError) {
      console.error("Error fetching plan:", planError)
      return defaultPlanInfo
    }

    // Если нет активного плана, возвращаем бесплатный план
    if (!userPlan) {
      return {
        ...defaultPlanInfo,
        // Если есть данные об использовании, используем их
        usage: usageData?.usage || 0,
        limit: usageData?.limit || PLAN_LIMITS.free.generationsPerMonth,
      }
    }

    // Получаем информацию о плане
    const plansData = userPlan.plans as any
    const planType = (plansData?.type || "free") as PlanType

    // Данные из meta
    const meta = (userPlan.meta as Record<string, any>) || {}

    // Определяем лимит использования
    // 1. Сначала проверяем, есть ли специфичный лимит в таблице usages
    // 2. Если нет, используем лимит из плана + add_usage
    // 3. Если ничего не определено, используем дефолтный лимит для типа плана
    const planLimit =
      usageData?.limit ||
      PLAN_LIMITS[planType].generationsPerMonth + (plansData?.add_usage || 0) ||
      PLAN_LIMITS[planType].generationsPerMonth

    // Подготавливаем информацию о плане
    const planInfo: PlanInfo = {
      id: userPlan.id.toString(),
      name:
        PLAN_LIMITS[planType]?.displayName ||
        plansData?.stripe_plan_id ||
        defaultPlanInfo.name,
      type: planType,
      period: plansData?.period || null,
      periodEnd: meta?.period_end || null,
      current_period_end: meta?.current_period_end || null,
      cancel_at_period_end: meta?.cancel_at_period_end || false,
      usage: usageData?.usage || 0,
      limit: planLimit,
      portal_url: meta?.portal_url || null,
      stripe_subscription_id: meta?.stripe_subscription_id || null,
      planData: plansData
        ? {
            id: plansData.id,
            stripe_plan_id: plansData.stripe_plan_id,
            price: plansData.price,
            env: plansData.env,
            period: plansData.period,
            type: plansData.type,
            add_usage: plansData.add_usage,
          }
        : undefined,
    }

    return planInfo
  } catch (error) {
    console.error("Unexpected error fetching plan:", error)
    return defaultPlanInfo
  }
}

// Always fetch fresh data on page load
export const dynamic = "force-dynamic"

export default async function GetStartedPage({
  searchParams,
}: {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined
  }>
}) {
  const resolvedSearchParams = await searchParams
  const { userId } = await auth()

  const apiKey = userId ? await getApiKey(userId) : null
  const subscription = await getCurrentPlan(userId)

  return (
    <div className="min-h-screen flex flex-col">
      <Logo />
      <Header />
      <div className="flex-1">
        <GetStartedClient
          initialApiKey={apiKey}
          userId={userId}
          subscription={subscription}
        />
      </div>
      <Footer />
    </div>
  )
}
