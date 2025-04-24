
import { config } from "dotenv"
import * as path from "path"
import { sendInvites } from "../lib/emails/send-invites"

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), ".env.local") })

async function main() {
  console.log("Starting to send invites...")

  try {
    const results = await sendInvites()

    console.log("\nResults:")
    results.forEach(({ email, success, error }) => {
      if (success) {
        console.log(`✅ ${email}: Sent successfully`)
      } else {
        console.log(`❌ ${email}: Failed - ${error}`)
      }
    })

    const successCount = results.filter((r) => r.success).length
    console.log(`\nSent ${successCount} out of ${results.length} invites`)
  } catch (error) {
    console.error("Failed to send invites:", error)
    process.exit(1)
  }
}

main()
