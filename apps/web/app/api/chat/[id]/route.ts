import { NextRequest, NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { addNoCacheHeaders, withNoCache } from "../middleware"

// Type definitions for our chat data
export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export interface Chat {
  id: string
  user_id: string
  title: string
  created_at: string
  messages: ChatMessage[]
}

// GET endpoint to fetch a chat by ID
async function getChat(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Await params to get the id
    const resolvedParams = await params
    const chatId = resolvedParams.id

    console.log("API: Fetching chat by ID:", chatId)

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 },
      )
    }

    // For development, we'll mock this data
    // In production, you would fetch this from Supabase
    const mockChat: Chat = {
      id: chatId,
      user_id: "user_123", // This would normally be the authenticated user's ID
      title: "Component Design Chat",
      created_at: new Date().toISOString(),
      messages: [
        {
          id: "msg_1",
          role: "user",
          content: "Create a hero section with a call to action button",
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        },
        {
          id: "msg_2",
          role: "assistant",
          content: "I've generated a UI component based on your request.",
          created_at: new Date(Date.now() - 3500000).toISOString(), // 58 minutes ago
        },
      ],
    }

    // Добавляем дополнительное логирование для отладки ответа
    console.log(
      "API: Returning chat data with",
      mockChat.messages.length,
      "messages",
    )

    // Добавляем заголовки для отключения кеширования
    const response = NextResponse.json(mockChat)
    return addNoCacheHeaders(response)
  } catch (error) {
    console.error("Error fetching chat:", error)
    return NextResponse.json({ error: "Failed to fetch chat" }, { status: 500 })
  }
}

// Экспортируем GET функцию с отключенным кешированием
export const GET = withNoCache(getChat)
