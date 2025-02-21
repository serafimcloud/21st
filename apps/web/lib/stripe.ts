import Stripe from "stripe"

const stripeSecretKey =
  process.env.NODE_ENV === "development"
    ? process.env.STRIPE_SECRET_KEY_TEST
    : process.env.STRIPE_SECRET_KEY_LIVE

const stripe = new Stripe(stripeSecretKey!)

type PlanDetails = {
  planType: string
  planPeriod: string
}

const subscriptionPlanIdMapping: Record<string, PlanDetails> = {
  // A
  price_1OiGAvC6xEbXLtEWaHhRVbNP: {
    planType: "growth",
    planPeriod: "annual",
  },
  price_1OiGAvC6xEbXLtEWJVSgmvSo: {
    planType: "growth",
    planPeriod: "monthly",
  },
  price_1OiGCjC6xEbXLtEWB5XhXf64: {
    planType: "scale",
    planPeriod: "annual",
  },
  price_1OiGD6C6xEbXLtEWjae8gD80: {
    planType: "scale",
    planPeriod: "monthly",
  },
}

export const getIdBySubscriptionPlanDetails = (
  plan: string,
  option: string,
) => {
  const priceId = Object.keys(subscriptionPlanIdMapping).find((id) => {
    const details = subscriptionPlanIdMapping[id]
    if (!details) return false
    return details.planType === plan && details.planPeriod === option
  })

  if (!priceId) {
    throw new Error("Invalid plan or option")
  }

  return priceId
}

export default stripe
