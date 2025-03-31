import { NextRequest, NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"
import { Chat } from "../route"
import { addNoCacheHeaders, withNoCache } from "../../middleware"

async function addMessage(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Await params to get the id
    const resolvedParams = await params
    const chatId = resolvedParams.id

    console.log("API: Adding message to chat ID:", chatId)

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 },
      )
    }

    // Get the message content and role from the request body
    const body = await request.json()
    const { content, role } = body

    if (!content || !role) {
      return NextResponse.json(
        { error: "Message content and role are required" },
        { status: 400 },
      )
    }

    if (role !== "user" && role !== "assistant") {
      return NextResponse.json(
        { error: "Role must be either 'user' or 'assistant'" },
        { status: 400 },
      )
    }

    // For development, we'll mock this data
    // In production, you would insert into Supabase
    const messageId = uuidv4()
    const createdAt = new Date().toISOString()

    const mockMessage = {
      id: messageId,
      chat_id: chatId,
      role,
      content,
      created_at: createdAt,
    }

    console.log(`API: Added message to chat ${chatId}:`, mockMessage)

    // Создаем ответ с заголовками для отключения кеширования
    const response = NextResponse.json(mockMessage)
    return addNoCacheHeaders(response)
  } catch (error) {
    console.error("Error adding message:", error)
    return NextResponse.json(
      { error: "Failed to add message" },
      { status: 500 },
    )
  }
}

// Экспортируем POST функцию с отключенным кешированием
export const POST = withNoCache(addMessage)
