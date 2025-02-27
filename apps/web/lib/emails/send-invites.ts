import { Resend } from "resend"
import { InviteEmail } from "./invite-template"
import inviteList from "../../config/invite-list.json"

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is not set")
}

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInvites() {
  const results = []

  for (const email of inviteList.emails) {
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

      results.push({ email, success: true, data })
      console.log(`✅ Sent invitation to ${email}`)

      // Add a small delay between sends to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`❌ Failed to send to ${email}:`, error)
      results.push({
        email,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return results
}
