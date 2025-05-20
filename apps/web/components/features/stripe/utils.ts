import Stripe from "stripe"

export const getStripeDetails = async (): Promise<{
  account: Stripe.Account
  isReady: boolean
}> => {
  const response = await fetch("/api/stripe/account", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
  if (!response.ok) {
    throw new Error("Failed to fetch Stripe account data")
  }
  const data = (await response.json()) as Stripe.Account
  const isReady =
    (data.requirements?.currently_due?.length ?? 0) === 0 &&
    data.payouts_enabled &&
    data.charges_enabled
  return { account: data, isReady }
}
