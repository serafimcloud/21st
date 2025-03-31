import type { Chat, ChatMessage } from "@/app/api/chat/[id]/route"

// Function to handle API response errors
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const errorMessage = errorData?.error || `API error: ${response.status}`
    throw new Error(errorMessage)
  }
  return response.json()
}

// Debug logging helper
const logToWindow = (message: string) => {
  if (typeof window !== "undefined") {
    window.console.log(
      "%c API LOG: " + message,
      "background: #222; color: #ff6b6b",
    )
  }
}

// Chat service with methods to interact with the API
export const chatApi = {
  // Create a new chat
  async createChat(title?: string): Promise<Chat> {
    console.log("Creating new chat with title:", title || "default")
    logToWindow(`Creating new chat with title: ${title || "default"}`)

    const response = await fetch("/api/chat/new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    })

    console.log("Create chat response status:", response.status)
    const result = await handleApiResponse(response)
    console.log("Created chat with ID:", result.id)
    return result
  },

  // Get chat by ID
  async getChat(chatId: string): Promise<Chat> {
    console.log("Fetching chat with ID:", chatId)
    logToWindow(`Fetching chat with ID: ${chatId}`)

    const response = await fetch(`/api/chat/${chatId}`, {
      // Добавляем больше заголовков для предотвращения кеширования
      headers: {
        Pragma: "no-cache",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      cache: "no-store",
      next: { revalidate: 0 },
    })

    console.log("Get chat response status:", response.status)
    const result = await handleApiResponse(response)
    console.log(
      "Retrieved chat data:",
      result.id,
      "with",
      result.messages?.length || 0,
      "messages",
    )
    return result
  },

  // Add a message to a chat
  async addMessage(
    chatId: string,
    content: string,
    role: "user" | "assistant",
  ): Promise<ChatMessage> {
    console.log(
      `Adding ${role} message to chat ${chatId}:`,
      content.substring(0, 50),
    )
    logToWindow(
      `Adding ${role} message to chat ${chatId}: ${content.substring(0, 50)}...`,
    )

    const response = await fetch(`/api/chat/${chatId}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Pragma: "no-cache",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      body: JSON.stringify({ content, role }),
      cache: "no-store",
    })

    console.log("Add message response status:", response.status)
    const result = await handleApiResponse(response)
    console.log("Message added:", result.id)
    return result
  },

  // Generate component from prompt
  async generateComponent(
    prompt: string,
    options?: {
      theme?: "light" | "dark"
      complexity?: "simple" | "medium" | "complex"
    },
  ): Promise<any> {
    console.log(`Generating component from prompt:`, prompt.substring(0, 50))
    logToWindow(
      `Generating component from prompt: "${prompt.substring(0, 50)}..."`,
    )

    const response = await fetch("/api/chat/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Pragma: "no-cache",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      body: JSON.stringify({ prompt, options }),
      cache: "no-store",
    })

    console.log("Generate component response status:", response.status)
    const result = await handleApiResponse(response)
    console.log("Component generated with ID:", result.id)
    return result
  },
}

// Re-export types for convenience
export type { Chat, ChatMessage }
