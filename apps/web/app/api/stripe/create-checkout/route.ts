import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import stripe, { getIdBySubscriptionPlanDetails } from "@/lib/stripe"
import { z } from "zod"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { PlanType } from "@/lib/subscription-limits"

// Схема для валидации данных запроса
const checkoutSchema = z.object({
  planId: z.enum(["standard", "pro"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  period: z.enum(["monthly", "yearly"]).optional().default("monthly"),
})

export async function POST(request: NextRequest) {
  try {
    // Валидация тела запроса
    const body = await request.json()

    const validationResult = checkoutSchema.safeParse(body)
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error)
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.errors,
        },
        { status: 400 },
      )
    }

    const { planId, successUrl, cancelUrl, period } = validationResult.data

    console.log("Creating checkout for plan:", planId, "period:", period)

    // Проверка авторизации
    const authSession = await auth()
    const userId = authSession?.userId
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Получаем email пользователя
    const { data: user, error: userError } = await supabaseWithAdminAccess
      .from("users")
      .select("email")
      .eq("id", userId)
      .maybeSingle()

    if (userError) {
      console.error("Error fetching user:", userError)
    }

    // Получаем ID Stripe Price для указанного плана и периода
    let priceId: string
    try {
      priceId = await getIdBySubscriptionPlanDetails(planId, period)
      console.log("Retrieved price ID:", priceId)
    } catch (error) {
      console.error("Error getting price ID:", error)
      return NextResponse.json(
        { error: "Invalid subscription plan configuration" },
        { status: 400 },
      )
    }

    // Создаем сессию Stripe Checkout
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        metadata: {
          userId,
        },
        ...(user?.email && { customer_email: user.email }),
        allow_promotion_codes: true,
        success_url: successUrl,
        cancel_url: cancelUrl,
        subscription_data: {
          metadata: {
            userId,
          },
        },
      })

      console.log("Created checkout session:", session.id)
      return NextResponse.json({ url: session.url })
    } catch (error) {
      console.error("Stripe session creation error:", error)
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
} 