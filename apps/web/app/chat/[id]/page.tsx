"use client"

import { motion } from "motion/react"
import { notFound, useParams } from "next/navigation"
import { ChatContainer } from "@/components/ui/chat-container"
import { PromptInput, PromptInputTextarea } from "@/components/ui/prompt-input"
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message"
import { Loader } from "@/components/ui/loader"
import { useEffect, useState } from "react"
import { chatApi, type Chat, type ChatMessage } from "@/lib/chat-service"
import { Header } from "@/components/ui/header.client"
import { Footer } from "@/components/ui/footer"

interface ChatPageProps {
  params: {
    id: string
  }
}

export default function ChatPage({ params }: ChatPageProps) {
  // Use the useParams hook instead of trying to unwrap params directly
  const routeParams = useParams()
  const chatId = routeParams.id as string

  const [message, setMessage] = useState("")
  const [chat, setChat] = useState<Chat | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

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
      const updatedChat = await chatApi.getChat(chatId)
      setChat(updatedChat)
      setMessage("")

      // Add mock AI response
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await chatApi.addMessage(
        chatId,
        "I'm a mock AI response to your message: " + message,
        "assistant",
      )
      const finalChat = await chatApi.getChat(chatId)
      setChat(finalChat)
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setSending(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto py-8 pt-20">
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="container mx-auto py-4 pt-20 h-full">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{chat?.title}</h1>
          </div>

          <div className="w-full h-[calc(100vh-160px)]">
            <ChatContainer className="h-full">
              <div className="flex flex-col h-full">
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
                      <p className="text-muted-foreground">
                        Start a new conversation...
                      </p>
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
                        <span className="text-muted-foreground text-sm">
                          Thinking...
                        </span>
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
              </div>
            </ChatContainer>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
