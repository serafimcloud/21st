"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PromptInput, PromptInputTextarea } from "@/components/ui/prompt-input"
import { chatApi } from "@/lib/chat-service"
import { Header } from "@/components/ui/header.client"
import { Footer } from "@/components/ui/footer"

export default function ChatPage() {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim() || isCreating) return

    try {
      setIsCreating(true)
      // Create a new chat
      const chat = await chatApi.createChat()

      // Add the first message
      await chatApi.addMessage(chat.id, message, "user")

      // Redirect to the chat page
      router.push(`/chat/${chat.id}`)
    } catch (error) {
      console.error("Failed to create chat:", error)
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="container max-w-[600px] mx-auto px-4">
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">
              Start a new conversation
            </h1>
            <p className="text-muted-foreground">
              Type your message below to start a new chat
            </p>
          </div>
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              placeholder="Ask me anything..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isCreating}
            />
          </PromptInput>
        </div>
      </main>
      <Footer />
    </div>
  )
}
