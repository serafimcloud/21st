import { config } from "dotenv"
import path from "path"

// Load environment variables from .env.local
config({
  path: path.resolve(process.cwd(), ".env.local"),
})

// Set required environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY
process.env.NEWSLETTER_AUDIENCE_ID = process.env.NEWSLETTER_AUDIENCE

import { sendWeeklyDigest } from "../lib/emails/send-weekly-digest"

async function main() {
  try {
    const result = await sendWeeklyDigest()
    console.log("Result:", result)
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  }
}

main()
