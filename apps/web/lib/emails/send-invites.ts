import { Resend } from "resend"
import { InviteEmail } from "./invite-template"
import sentInvites from "../../config/sent-invites.json"
import fs from "fs"
import path from "path"
import { ListContactsResponse, ListContactsOptions } from "../../types/resend"

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is not set")
}

if (!process.env.RESEND_AUDIENCE_ID) {
  throw new Error("RESEND_AUDIENCE_ID environment variable is not set")
}

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendInviteResult {
  email: string
  success: boolean
  data?: unknown
  error?: string
}

interface EmailLog {
  email: string
  sentAt: string
  success: boolean
  error?: string
}

// Function to update sent-invites.json
function updateSentInvites(email: string) {
  const filePath = path.join(process.cwd(), "apps/web/config/sent-invites.json")
  const currentData = JSON.parse(fs.readFileSync(filePath, "utf8"))

  if (!currentData.sent_emails.includes(email)) {
    currentData.sent_emails.push(email)
    fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2))
  }
}

// Function to log email sending history
function logEmailSending(log: EmailLog) {
  const logFilePath = path.join(
    process.cwd(),
    "apps/web/logs/email-history.json",
  )

  // Create logs directory if it doesn't exist
  const logsDir = path.join(process.cwd(), "apps/web/logs")
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
  }

  // Read existing logs or create new log file
  let logs: EmailLog[] = []
  if (fs.existsSync(logFilePath)) {
    logs = JSON.parse(fs.readFileSync(logFilePath, "utf8"))
  }

  // Add new log entry
  logs.push(log)

  // Write updated logs
  fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2))
}

export async function sendInvites(): Promise<SendInviteResult[]> {
  const results: SendInviteResult[] = []

  try {
    // Fetch contacts from Resend
    const options: ListContactsOptions = {
      audienceId: process.env.RESEND_AUDIENCE_ID!,
    }
    const contactsResponse = await resend.contacts.list(options)

    // Extract emails from the response
    const resendContacts =
      contactsResponse.data?.data?.map((contact) =>
        contact.email.toLowerCase(),
      ) || []

    console.log(
      `📊 Total contacts in Resend audience: ${resendContacts.length}`,
    )
    console.log(`📬 Already sent invites: ${sentInvites.sent_emails.length}`)

    // Filter out already sent invites
    const emailsToSend = resendContacts.filter(
      (email) => !sentInvites.sent_emails.includes(email),
    )

    console.log(`📨 Remaining emails to send: ${emailsToSend.length}`)

    if (emailsToSend.length === 0) {
      console.log("✨ No new emails to send!")
      return results
    }

    console.log("\n🚀 Starting to send invites...\n")

    for (const email of emailsToSend) {
      try {
        // Create an encoded email parameter for the URL
        const encodedEmail = Buffer.from(email).toString("base64")
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/magic/console?waitlist=${encodedEmail}`

        const data = await resend.emails.send({
          from: "Serafim from 21st.dev <serafim@hey.21st.dev>",
          to: email,
          subject: "You're invited to join 21st.dev",
          react: InviteEmail({ inviteUrl }),
        })

        // Update sent-invites.json
        updateSentInvites(email)

        // Log successful email sending
        logEmailSending({
          email,
          sentAt: new Date().toISOString(),
          success: true,
        })

        results.push({ email, success: true, data })
        console.log(
          `✅ Sent invitation to ${email} (${emailsToSend.indexOf(email) + 1}/${emailsToSend.length})`,
        )

        // Add a small delay between sends to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        // Log failed email sending
        logEmailSending({
          email,
          sentAt: new Date().toISOString(),
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })

        console.error(
          `❌ Failed to send to ${email} (${emailsToSend.indexOf(email) + 1}/${emailsToSend.length}):`,
          error,
        )
        results.push({
          email,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    console.log("\n✅ Finished sending invites!")
    console.log(`📊 Summary:`)
    console.log(`   - Total processed: ${emailsToSend.length}`)
    console.log(`   - Successful: ${results.filter((r) => r.success).length}`)
    console.log(`   - Failed: ${results.filter((r) => !r.success).length}`)
  } catch (error) {
    console.error("Failed to fetch contacts from Resend:", error)
    throw error
  }

  return results
}
