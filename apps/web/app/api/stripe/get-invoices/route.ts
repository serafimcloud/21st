import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { stripeV1, stripeV2 } from "@/lib/stripe"
import type Stripe from "stripe"
import { supabaseWithAdminAccess } from "@/lib/supabase"

export async function GET() {
  try {
    const authSession = await auth()
    const user = await currentUser()
    const userId = authSession?.userId

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = supabaseWithAdminAccess

    const { data: userPlanData, error: userPlanError } = await supabase
      .from("users_to_plans")
      .select("*, plans(*)")
      .eq("user_id", userId)
      .single()

    if (userPlanError) {
      // Error handled silently
    }

    // Determine which Stripe instance to use based on plan version
    const planVersion = userPlanData?.plans?.version || 1
    const stripeInstance = planVersion === 1 ? stripeV1 : stripeV2

    let customerId = null

    if (
      userPlanData?.meta &&
      typeof userPlanData.meta === "object" &&
      userPlanData.meta !== null &&
      "stripe_customer_id" in userPlanData.meta
    ) {
      customerId = (userPlanData.meta as { stripe_customer_id?: string })
        .stripe_customer_id
    }

    if (!customerId) {
      // Try to get email from user object
      const email = user?.emailAddresses?.[0]?.emailAddress || null

      // Approach 1: Try to find customer by email if available
      let stripeCustomers: Stripe.ApiList<Stripe.Customer> | null = null

      if (email) {
        stripeCustomers = await stripeInstance.customers.list({
          email,
          limit: 1,
        })
      }

      // Approach 2: If no customers found by email, try to find by userId in metadata
      if (!stripeCustomers?.data.length) {
        stripeCustomers = await stripeInstance.customers.list({
          limit: 100, // Get more customers to search through
        })

        // Filter customers with matching userId in metadata
        const filteredCustomers = stripeCustomers.data.filter(
          (customer) => customer.metadata?.userId === userId,
        )

        // Override the stripeCustomers data with our filtered results
        stripeCustomers.data = filteredCustomers
      }

      // If still no customer found
      if (!stripeCustomers?.data.length) {
        // User has no associated Stripe customer - thus no payment history
        return NextResponse.json({ invoices: [] })
      }

      // TypeScript safety check
      const customer = stripeCustomers.data[0]
      if (!customer || !customer.id) {
        return NextResponse.json(
          { error: "Invalid customer data" },
          { status: 500 },
        )
      }

      customerId = customer.id

      if (userPlanData && customerId) {
        const existingMeta = userPlanData.meta || {}

        const metaObject =
          typeof existingMeta === "object" ? { ...existingMeta } : {}

        const newMeta = {
          ...metaObject,
          stripe_customer_id: customerId,
        }

        await supabase
          .from("users_to_plans")
          .update({ meta: newMeta })
          .eq("user_id", userId)
      }
    }

    const invoices = await stripeInstance.invoices.list({
      customer: customerId,
      limit: 10, // Limit to 10 most recent invoices
    })

    // Transform invoices into a simpler format for frontend
    const formattedInvoices = invoices.data.map((invoice) => {
      return {
        id: invoice.id || "",
        number: invoice.number || "",
        created: invoice.created || 0,
        amount_paid: (invoice.amount_paid || 0) / 100,
        status: invoice.status || "unknown",
        period_start: invoice.period_start || 0,
        period_end: invoice.period_end || 0,
        invoice_pdf: invoice.invoice_pdf || null,
        currency: invoice.currency || "usd",
      }
    })

    return NextResponse.json({ invoices: formattedInvoices })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to retrieve payment history" },
      { status: 500 },
    )
  }
}
