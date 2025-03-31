import { v4 as uuidv4 } from "uuid"

// Define interfaces for our chat data
export interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant"
  createdAt: string
}

export interface Chat {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

// Get chats from localStorage or initialize an empty object
const getStoredChats = (): Record<string, Chat> => {
  if (typeof window === "undefined") return {}

  try {
    const storedChats = localStorage.getItem("chats")
    return storedChats ? JSON.parse(storedChats) : {}
  } catch (error) {
    console.error("Failed to parse chats from localStorage:", error)
    return {}
  }
}

// Save chats to localStorage
const saveChatsToStorage = (chats: Record<string, Chat>): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("chats", JSON.stringify(chats))
  } catch (error) {
    console.error("Failed to save chats to localStorage:", error)
  }
}

// Initialize chats from localStorage
let chats: Record<string, Chat> = {}

// We'll initialize it in a useEffect or when the module is first loaded on the client
const initializeChats = () => {
  if (typeof window !== "undefined") {
    chats = getStoredChats()
  }
}

// Call initialization when this module is imported on the client side
if (typeof window !== "undefined") {
  initializeChats()
}

export const chatService = {
  /**
   * Create a new chat
   */
  async createChat(): Promise<Chat> {
    const id = uuidv4()
    const now = new Date().toISOString()

    const newChat: Chat = {
      id,
      title: "New Conversation",
      messages: [],
      createdAt: now,
      updatedAt: now,
    }

    chats[id] = newChat
    saveChatsToStorage(chats)
    return newChat
  },

  /**
   * Get a chat by ID
   */
  async getChat(id: string): Promise<Chat | null> {
    // Ensure we have the latest chats from localStorage
    if (typeof window !== "undefined") {
      chats = getStoredChats()
    }
    return chats[id] || null
  },

  /**
   * Add a message to a chat
   */
  async addMessage(
    chatId: string,
    content: string,
    role: "user" | "assistant",
  ): Promise<ChatMessage> {
    const chat = chats[chatId]

    if (!chat) {
      throw new Error(`Chat with ID ${chatId} not found`)
    }

    const message: ChatMessage = {
      id: uuidv4(),
      content,
      role,
      createdAt: new Date().toISOString(),
    }

    chat.messages.push(message)
    chat.updatedAt = new Date().toISOString()

    // If this is the first user message, update the chat title
    if (chat.messages.length === 1 && role === "user") {
      chat.title = content.substring(0, 30) + (content.length > 30 ? "..." : "")
    }

    saveChatsToStorage(chats)
    return message
  },

  /**
   * List all chats
   */
  async listChats(): Promise<Chat[]> {
    // Ensure we have the latest chats from localStorage
    if (typeof window !== "undefined") {
      chats = getStoredChats()
    }

    return Object.values(chats).sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  },
}

// This is a placeholder for the future Supabase implementation
export const chatServiceWithSupabase = {
  // The interface will remain the same, but the implementation will use Supabase
  createChat: chatService.createChat,
  getChat: chatService.getChat,
  addMessage: chatService.addMessage,
  listChats: chatService.listChats,
}

// Export the service that should be used in the application
// When migrating to Supabase, change this to chatServiceWithSupabase
export const chatApi = chatService
