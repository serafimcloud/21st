"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Card } from "@/components/ui/card"
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
      <main className="flex-1">
        <div className="container mx-auto py-8 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">New Chat</h1>
            </div>

            <Card className="p-6">
              <div className="flex flex-col min-h-[500px]">
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <h2 className="text-2xl font-semibold mb-4">
                      Start a new conversation
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Type your message below to start a new chat. Your
                      conversation will be saved automatically.
                    </p>
                  </div>
                </div>
                <PromptInput onSubmit={handleSubmit}>
                  <PromptInputTextarea
                    placeholder="Type your message to start a new chat..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isCreating}
                  />
                </PromptInput>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
