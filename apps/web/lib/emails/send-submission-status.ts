import { Resend } from "resend"
import { SubmissionStatusEmail } from "./submission-status-template"
import type {
  Submission,
  SubmissionStatus,
} from "@/components/features/admin/types"
import { config } from "dotenv"
import * as path from "path"
import { supabaseWithAdminAccess } from "@/lib/supabase"

// Проверяем, выполняется ли код на сервере или клиенте
const isServer = typeof window === "undefined"

// Загружаем переменные окружения из .env.local, если функция запускается вне Next.js
if (isServer && !process.env.NEXT_PUBLIC_APP_URL) {
  try {
    config({ path: path.resolve(process.cwd(), ".env.local") })
    console.log("Loaded environment variables from .env.local")
  } catch (error) {
    console.warn("Failed to load environment variables from .env.local:", error)
  }
}

// Инициализируем Resend только на сервере
let resend: Resend | undefined
if (isServer) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY environment variable is not set")
  } else {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
}

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
  // Если функция вызывается на клиенте, выводим предупреждение и возвращаем успех
  if (!isServer) {
    console.warn("Email sending is only available on the server side")
    return { success: true, data: null }
  }

  try {
    const componentName = submission.component_data.name
    const demoName = submission.name ? `| ${submission.name}` : ""
    const username =
      submission.user_data.display_name || submission.user_data.username

    // Получаем email пользователя из базы данных
    const userId = submission.user_data.id
    const { data: userData, error: userError } = await supabaseWithAdminAccess
      .from("users")
      .select("email")
      .eq("id", userId)
      .single()

    if (userError || !userData?.email) {
      console.error("Failed to get user email:", userError)
      return {
        success: false,
        error: "Failed to get user email",
      }
    }

    const userEmail = userData.email

    // Проверяем наличие API ключа и инициализированного Resend
    if (!resend) {
      console.error("Resend is not initialized, cannot send email")
      return {
        success: false,
        error: "Resend API client is not initialized",
      }
    }

    // Создаем URL компонента
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://21st.dev"
    const componentUrl = `${baseUrl}/${submission.user_data.username}/${submission.component_data.component_slug}/${submission.demo_slug}`

    const data = await resend.emails.send({
      from: "Serafim from 21st.dev <serafim@hey.21st.dev>",
      to: userEmail,
      replyTo: "21st.dev Support <support@21st.dev>",
      subject: getEmailSubject(status, componentName),
      react: SubmissionStatusEmail({
        componentName,
        demoName,
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
      return `Your component "${componentName}" has been posted, but not featured`
    case "rejected":
      return `Update on your submission: "${componentName}"`
    default:
      return `Status update for your component: "${componentName}"`
  }
}
