import { Resend } from "resend"
import { WeeklyDigestEmail } from "./weekly-digest-template"
import { supabaseWithAdminAccess } from "@/lib/supabase"

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is not set")
}

if (!process.env.NEWSLETTER_AUDIENCE) {
  throw new Error("NEWSLETTER_AUDIENCE environment variable is not set")
}

const resend = new Resend(process.env.RESEND_API_KEY)
const NEWSLETTER_AUDIENCE_ID = process.env.NEWSLETTER_AUDIENCE

interface Component {
  id: string
  name: string
  description: string
  username: string
  component_slug: string
  preview_url: string
  demo_slug: string
  demo_preview_url: string
  is_paid: boolean
  is_current_week: boolean
}

export async function sendWeeklyDigest(skipTestEmail = false) {
  console.log("Starting weekly digest...")

  try {
    // Get top components
    console.log("Fetching top components...")
    const { data: components, error } = await supabaseWithAdminAccess.rpc(
      "get_top_components_for_email",
    )

    if (error) {
      throw new Error(`Failed to fetch components: ${error.message}`)
    }

    if (!components || components.length === 0) {
      console.log("No components to send in digest")
      return {
        success: false,
        message: "No components found for digest",
      }
    }

    console.log(`Found ${components.length} components to include in digest`)

    // First, send test email to admin
    if (!skipTestEmail) {
      console.log("Sending test email to admin...")
      const testEmailResult = await resend.emails.send({
        from: "Serafim from 21st.dev <serafim@hey.21st.dev>",
        to: "serafimcloud@gmail.com",
        subject: "[TEST] 🎨 This week's top UI components from 21st.dev",
        react: WeeklyDigestEmail({ components: components as Component[] }),
        text: "Please approve this test email to send to the full audience. Reply with 'Approved' to proceed.",
      })

      if (!testEmailResult.data) {
        throw new Error("Failed to send test email")
      }

      console.log("Test email sent:", testEmailResult)
      return {
        success: true,
        message: "Test email sent for approval",
        testEmailId: testEmailResult.data.id,
      }
    }

    // Send to full audience using broadcasts
    console.log("Creating broadcast for the audience...")
    const broadcast = await resend.broadcasts.create({
      name: "Weekly UI Components Digest",
      from: "Serafim from 21st.dev <serafim@hey.21st.dev>",
      subject: "🎨 This week's top UI components from 21st.dev",
      react: WeeklyDigestEmail({ components: components as Component[] }),
      audienceId: NEWSLETTER_AUDIENCE_ID,
    })

    if (!broadcast.data) {
      throw new Error("Failed to create broadcast")
    }

    console.log("Sending broadcast to audience...")
    const audienceResult = await resend.broadcasts.send(broadcast.data.id)

    if (!audienceResult.data) {
      throw new Error("Failed to send broadcast")
    }

    console.log("Digest broadcast sent to audience:", audienceResult)
    return {
      success: true,
      message: "Weekly digest broadcast sent to full audience",
      broadcastId: broadcast.data.id,
    }
  } catch (error) {
    console.error("Error sending weekly digest:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Function to send to full audience after approval
export async function sendApprovedDigest(testEmailId: string) {
  console.log("Sending approved digest to full audience...")
  return sendWeeklyDigest(true)
}

// Run if this file is being executed directly
if (require.main === module) {
  sendWeeklyDigest()
    .then((result) => {
      console.log("Weekly digest result:", result)
      if (!result?.success) {
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error("Failed to send weekly digest:", error)
      process.exit(1)
    })
}
