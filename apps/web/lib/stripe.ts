import Stripe from "stripe"

const stripeSecretKey =
  process.env.NODE_ENV === "development"
    ? process.env.STRIPE_SECRET_KEY_TEST
    : process.env.STRIPE_SECRET_KEY_LIVE

if (!stripeSecretKey) {
  throw new Error("Stripe secret key is not set")
}

const stripe = new Stripe(stripeSecretKey)

const subscriptionPlanIdMapping: Record<
  string,
  { planType: string; planPeriod: string }
> = {
  price_1Qvtk0GzKO6Ssj01mJ6dN7fy: {
    planType: "growth",
    planPeriod: "annual",
  },
  price_1Qvtm4GzKO6Ssj01FJWVVc9A: {
    planType: "growth",
    planPeriod: "monthly",
  },
  price_1QvtjIGzKO6Ssj01PED9EAbH: {
    planType: "scale",
    planPeriod: "annual",
  },
  price_1QvtnXGzKO6Ssj016zFemxKy: {
    planType: "scale",
    planPeriod: "monthly",
  },
}

export const getIdBySubscriptionPlanDetails = (
  plan: string,
  option: string,
): string => {
  const priceId = Object.entries(subscriptionPlanIdMapping).find(
    ([_, details]) =>
      details.planType === plan && details.planPeriod === option,
  )?.[0]

  if (!priceId) {
    throw new Error(`No price ID found for plan: ${plan} and option: ${option}`)
  }

  return priceId
}

export const getSubscriptionPlanDetailsById = (planId: string) => {
  const details = subscriptionPlanIdMapping[planId]
  if (!details) {
    throw new Error(`No subscription plan found for ID: ${planId}`)
  }

  return details
}

export default stripe
