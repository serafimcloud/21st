"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { PromptInput, PromptInputTextarea } from "@/components/ui/prompt-input"
import { Spinner } from "@/components/icons/spinner"
import { chatApi } from "@/lib/chat-service"
import type { Chat } from "@/app/api/chat/[id]/route"
import { notFound } from "next/navigation"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { motion } from "motion/react"
import { ChatComponentPreview } from "@/components/features/chat/ChatComponentPreview"

interface ChatClientProps {
  chatId: string
}

export function ChatClient({ chatId }: ChatClientProps) {
  const [message, setMessage] = useState("")
  const [chat, setChat] = useState<Chat | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState("")
  const [componentGenerated, setComponentGenerated] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [minLoadingTimeElapsed, setMinLoadingTimeElapsed] = useState(false)

  useEffect(() => {
    async function loadChat() {
      try {
        const chatData = await chatApi.getChat(chatId)

        if (!chatData) {
          notFound()
        }

        setChat(chatData)

        if (chatData.messages && chatData.messages.length > 0) {
          const lastUserMessageIndex = [...chatData.messages]
            .reverse()
            .findIndex((msg) => msg.role === "user")

          if (lastUserMessageIndex !== -1) {
            const userMessageIndex =
              chatData.messages.length - 1 - lastUserMessageIndex
            const userMessage = chatData.messages[userMessageIndex]
            if (userMessage && userMessage.content) {
              setCurrentPrompt(userMessage.content)

              setGenerating(true)
              setGenerationProgress(0)

              let progress = 0
              const progressInterval = setInterval(() => {
                progress += 15
                setGenerationProgress(progress)

                if (progress >= 100) {
                  clearInterval(progressInterval)
                  setTimeout(() => {
                    setGenerating(false)
                    setComponentGenerated(true)
                  }, 3000)
                }
              }, 300)
            }
          }
        }
      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false)
      }
    }

    loadChat()
  }, [chatId])

  const handleSubmit = async () => {
    if (!message.trim() || generating) return

    try {
      setGenerating(true)
      setGenerationProgress(0)
      setMinLoadingTimeElapsed(false)
      setComponentGenerated(false)

      const promptText = message
      setCurrentPrompt(promptText)
      setMessage("")

      await chatApi.addMessage(chatId, promptText, "user")

      setTimeout(() => {
        setMinLoadingTimeElapsed(true)
      }, 3000)

      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          const newProgress = prev + 5
          return newProgress > 90 ? 90 : newProgress
        })
      }, 500)

      setGenerationProgress(95)
      await new Promise((resolve) => setTimeout(resolve, 500))
      setGenerationProgress(100)
      await new Promise((resolve) => setTimeout(resolve, 500))

      clearInterval(progressInterval)

      await chatApi.addMessage(
        chatId,
        "I've generated a UI component based on your request.",
        "assistant",
      )

      if (!minLoadingTimeElapsed) {
        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (minLoadingTimeElapsed) {
              clearInterval(checkInterval)
              resolve(null)
            }
          }, 100)
        })
      }

      const updatedChat = await chatApi.getChat(chatId)
      setChat(updatedChat)

      setComponentGenerated(true)
    } catch (error) {
      // Handle error silently
    } finally {
      // Ensure generating state is active for at least 3 seconds
      if (!minLoadingTimeElapsed) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }

      setGenerating(false)
      setGenerationProgress(0)
    }
  }

  // Memoize the prompt display to prevent unnecessary re-renders
  const promptDisplay = useMemo(() => {
    if (!currentPrompt) return null

    return (
      <div className="py-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {generating ? (
            <TextShimmer className="font-medium max-w-2xl mx-auto">
              {currentPrompt}
            </TextShimmer>
          ) : (
            <span className="font-medium max-w-2xl mx-auto">
              {currentPrompt}
            </span>
          )}
        </motion.div>
      </div>
    )
  }, [currentPrompt, generating])

  // Initial loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top area: user prompt with shimmer effect during generation */}
      {promptDisplay}

      {/* Middle area: component preview or loading state */}
      <div className="flex-1 mx-4 mb-4">
        <ChatComponentPreview
          generating={generating}
          componentGenerated={componentGenerated}
        />
      </div>

      {/* Bottom area: input field */}
      <div className="p-4 mt-auto">
        {componentGenerated && !generating ? (
          <PromptInput onSubmit={handleSubmit} className="bg-muted/50">
            <input
              type="text"
              className="flex h-10 w-full rounded-md bg-transparent px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Modify this component (e.g., 'make it darker', 'add a search bar')..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={generating}
            />
          </PromptInput>
        ) : (
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              placeholder="Describe the UI component you want to build..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={generating}
              style={{ color: "inherit" }}
            />
          </PromptInput>
        )}
      </div>
    </div>
  )
}
