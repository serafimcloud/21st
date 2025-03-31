"use client"

import { useEffect, useState } from "react"
import { PromptInput, PromptInputTextarea } from "@/components/ui/prompt-input"
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message"
import { Loader } from "@/components/ui/loader"
import { chatApi, type Chat } from "@/lib/chat-service"
import { useRouter } from "next/navigation"
import { notFound } from "next/navigation"

interface ChatClientProps {
  chatId: string
}

export function ChatClient({ chatId }: ChatClientProps) {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [chat, setChat] = useState<Chat | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // Загружаем данные чата на клиенте
  useEffect(() => {
    async function loadChat() {
      try {
        const chatData = await chatApi.getChat(chatId)
        if (!chatData) {
          notFound()
        }
        setChat(chatData)
      } catch (error) {
        console.error("Failed to load chat:", error)
      } finally {
        setLoading(false)
      }
    }

    loadChat()
  }, [chatId])

  const handleSubmit = async () => {
    if (!message.trim() || sending) return

    try {
      setSending(true)
      // Add message to existing chat
      await chatApi.addMessage(chatId, message, "user")
      // Get the updated chat
      setMessage("")

      // Add mock AI response
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await chatApi.addMessage(
        chatId,
        "I'm a mock AI response to your message: " + message,
        "assistant",
      )

      // Reload the chat data
      const updatedChat = await chatApi.getChat(chatId)
      setChat(updatedChat)
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setSending(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{chat?.title}</h1>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {chat && chat.messages.length > 0 ? (
          chat.messages.map((msg) => (
            <Message key={msg.id}>
              <MessageAvatar
                src={
                  msg.role === "assistant"
                    ? "/assistant-avatar.png"
                    : "/user-avatar.png"
                }
                alt={msg.role === "assistant" ? "Assistant" : "User"}
                fallback={msg.role === "assistant" ? "AI" : "U"}
              />
              <MessageContent>{msg.content}</MessageContent>
            </Message>
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Start a new conversation...</p>
          </div>
        )}
        {sending && (
          <Message>
            <MessageAvatar
              src="/assistant-avatar.png"
              alt="Assistant"
              fallback="AI"
            />
            <div className="flex items-center space-x-2 p-4">
              <Loader size="sm" />
              <span className="text-muted-foreground text-sm">Thinking...</span>
            </div>
          </Message>
        )}
      </div>
      <div className="p-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
          />
        </PromptInput>
      </div>
    </>
  )
}
