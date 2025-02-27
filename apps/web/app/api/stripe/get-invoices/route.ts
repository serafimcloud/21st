import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import stripe from "@/lib/stripe"
import type Stripe from "stripe"
import { supabaseWithAdminAccess } from "@/lib/supabase"

export async function GET() {
  console.log("Starting get-invoices API request")

  try {
    // Get current user session from Clerk
    const authSession = await auth()
    console.log("Auth session:", !!authSession?.userId)

    const userId = authSession?.userId
    if (!userId) {
      console.log("No user ID found in session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = supabaseWithAdminAccess
    console.log(
      "Looking up user subscription data in Supabase for userId:",
      userId,
    )

    const { data: userPlanData, error: userPlanError } = await supabase
      .from("users_to_plans")
      .select("*, plans(*)")
      .eq("user_id", userId)
      .single()

    if (userPlanError) {
      console.error("Supabase error:", userPlanError)
    }

    console.log("User plan data from Supabase:", userPlanData || "Not found")

    let customerId = null

    if (
      userPlanData?.meta &&
      typeof userPlanData.meta === "object" &&
      userPlanData.meta !== null &&
      "stripe_customer_id" in userPlanData.meta
    ) {
      customerId = (userPlanData.meta as { stripe_customer_id?: string })
        .stripe_customer_id
      console.log("Found Stripe Customer ID in Supabase:", customerId)
    }

    if (!customerId) {
      console.log("No customer ID in Supabase, searching in Stripe")

      // Try to get email from session
      const email = authSession.user?.emailAddresses?.[0]?.emailAddress
      console.log("User email:", email || "Not found")

      // Approach 1: Try to find customer by email if available
      let stripeCustomers: Stripe.ApiList<Stripe.Customer> | null = null

      if (email) {
        console.log("Looking up Stripe customer for email:", email)
        stripeCustomers = await stripe.customers.list({
          email,
          limit: 1,
        })
        console.log(
          "Stripe customers found by email:",
          stripeCustomers.data.length,
        )
      }

      // Approach 2: If no customers found by email, try to find by userId in metadata
      if (!stripeCustomers?.data.length) {
        console.log(
          "No customer found by email, trying to find by userId:",
          userId,
        )
        stripeCustomers = await stripe.customers.list({
          limit: 100, // Get more customers to search through
        })

        // Filter customers with matching userId in metadata
        const filteredCustomers = stripeCustomers.data.filter(
          (customer) => customer.metadata?.userId === userId,
        )

        console.log(
          "Stripe customers found by userId in metadata:",
          filteredCustomers.length,
        )

        // Override the stripeCustomers data with our filtered results
        stripeCustomers.data = filteredCustomers
      }

      // If still no customer found
      if (!stripeCustomers?.data.length) {
        // User has no associated Stripe customer - thus no payment history
        console.log("No Stripe customer found for user:", userId)
        return NextResponse.json({ invoices: [] })
      }

      // TypeScript safety check
      const customer = stripeCustomers.data[0]
      if (!customer || !customer.id) {
        console.log("Invalid customer data:", customer)
        return NextResponse.json(
          { error: "Invalid customer data" },
          { status: 500 },
        )
      }

      customerId = customer.id
      console.log("Customer ID from Stripe:", customerId)

      if (userPlanData && customerId) {
        const existingMeta = userPlanData.meta || {}

        const metaObject =
          typeof existingMeta === "object" ? { ...existingMeta } : {}

        const newMeta = {
          ...metaObject,
          stripe_customer_id: customerId,
        }

        const { error: updateError } = await supabase
          .from("users_to_plans")
          .update({ meta: newMeta })
          .eq("user_id", userId)

        if (updateError) {
          console.error(
            "Failed to update Stripe customer ID in Supabase:",
            updateError,
          )
        } else {
          console.log("Updated Stripe customer ID in Supabase")
        }
      }
    }

    console.log("Fetching invoices for customer:", customerId)
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10, // Limit to 10 most recent invoices
    })

    console.log("Invoices found:", invoices.data.length)

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

    console.log("Returning formatted invoices:", formattedInvoices.length)
    return NextResponse.json({ invoices: formattedInvoices })
  } catch (error) {
    console.error("Error fetching payment history:", error)
    return NextResponse.json(
      { error: "Failed to retrieve payment history" },
      { status: 500 },
    )
  }
}
