import { Resend } from "resend"
import { NextResponse } from "next/server"

const resend = new Resend(process.env.RESEND_API_KEY)

const AUDIENCES = {
  MAGIC_WAITLIST: process.env.MAGIC_WAITLIST_AUDIENCE || "",
  NEWSLETTER: process.env.NEWSLETTER_AUDIENCE || "",
} as const

export async function POST(request: Request) {
  try {
    const { email, type } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!type || !["newsletter", "magic-waitlist"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid subscription type" },
        { status: 400 },
      )
    }

    const audienceId =
      type === "newsletter" ? AUDIENCES.NEWSLETTER : AUDIENCES.MAGIC_WAITLIST

    const response = await resend.contacts.create({
      email,
      audienceId,
    })

    return NextResponse.json({ success: true, data: response })
  } catch (error) {
    console.error("Subscription error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to subscribe",
      },
      { status: 500 },
    )
  }
}
