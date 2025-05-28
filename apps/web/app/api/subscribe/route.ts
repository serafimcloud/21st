import { Resend } from "resend"
import { NextResponse } from "next/server"

const AUDIENCES = {
  MAGIC_WAITLIST: process.env.MAGIC_WAITLIST_AUDIENCE ?? "",
  NEWSLETTER: process.env.NEWSLETTER_AUDIENCE ?? "",
  MAGIC_CHAT_WAITLIST: process.env.MAGIC_CHAT_WAITING_AUDIENCE ?? "",
} as const

export async function POST(request: Request) {
  try {
    // Check environment variables
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not set in environment variables" },
        { status: 500 },
      )
    }

    if (
      !process.env.MAGIC_WAITLIST_AUDIENCE ||
      !process.env.NEWSLETTER_AUDIENCE ||
      !process.env.MAGIC_CHAT_WAITING_AUDIENCE
    ) {
      return NextResponse.json(
        {
          error:
            "MAGIC_WAITLIST_AUDIENCE, NEWSLETTER_AUDIENCE, or MAGIC_CHAT_WAITING_AUDIENCE is not set in environment variables",
        },
        { status: 500 },
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { email, type } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (
      !type ||
      !["newsletter", "magic-waitlist", "magic-chat"].includes(type)
    ) {
      return NextResponse.json(
        { error: "Invalid subscription type" },
        { status: 400 },
      )
    }

    const audienceId =
      type === "newsletter"
        ? AUDIENCES.NEWSLETTER
        : type === "magic-waitlist"
          ? AUDIENCES.MAGIC_WAITLIST
          : AUDIENCES.MAGIC_CHAT_WAITLIST

    if (!audienceId) {
      return NextResponse.json(
        { error: "Invalid audience configuration" },
        { status: 500 },
      )
    }

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
