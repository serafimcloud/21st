import { Resend } from "resend"
import { SubmissionStatusEmail } from "./submission-status-template"
import type {
  Submission,
  SubmissionStatus,
} from "@/components/features/admin/types"

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is not set")
}

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendSubmissionStatusEmailParams {
  submission: Submission
  status: SubmissionStatus
  feedback?: string
}

export async function sendSubmissionStatusEmail({
  submission,
  status,
  feedback,
}: SendSubmissionStatusEmailParams) {
  try {
    const componentName = submission.name || submission.component_data.name
    const username =
      submission.user_data.display_name || submission.user_data.username
    const userEmail = submission.user_data.email

    // If we don't have an email, log an error and return
    if (!userEmail) {
      console.error(
        `Cannot send email: No email found for user ${username} (ID: ${submission.user_data.id})`,
      )
      return {
        success: false,
        error: "No email address available for user",
      }
    }

    // Create component URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://21st.dev"
    const componentSlug =
      submission.demo_slug || submission.component_data.component_slug
    const componentUrl = `${baseUrl}/component/${componentSlug}`

    const data = await resend.emails.send({
      from: "21st.dev Team <notifications@21st.dev>",
      to: userEmail,
      subject: getEmailSubject(status, componentName),
      react: SubmissionStatusEmail({
        componentName,
        status,
        feedback,
        username,
        componentUrl,
      }),
    })

    console.log(
      `✅ Sent status update email to ${userEmail} for component "${componentName}"`,
    )

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Failed to send submission status email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

function getEmailSubject(
  status: SubmissionStatus,
  componentName: string,
): string {
  switch (status) {
    case "featured":
      return `🌟 Your component "${componentName}" has been featured!`
    case "posted":
      return `✅ Your component "${componentName}" has been approved`
    case "rejected":
      return `Update on your submission: "${componentName}"`
    default:
      return `Status update for your component: "${componentName}"`
  }
}
