import { sendSubmissionStatusEmail } from "@/lib/emails/send-submission-status"
import { Submission, SubmissionStatus } from "@/components/features/admin/types"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { submission, status, feedback } = body as {
      submission: Submission
      status: SubmissionStatus
      feedback?: string
    }

    if (!submission || !status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      )
    }

    const result = await sendSubmissionStatusEmail({
      submission,
      status,
      feedback,
    })

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error sending submission status email:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
