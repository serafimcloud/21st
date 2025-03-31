"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import { Button } from "@/components/ui/button"
import { ArrowUp, Square } from "lucide-react"
import { chatApi } from "@/lib/chat-service"
import { useAuth, useClerk } from "@clerk/nextjs"

// Key for storing the pending message in localStorage
const PENDING_MESSAGE_KEY = "pending_chat_message"

export function ChatClient() {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const { openSignIn } = useClerk()
  const [message, setMessage] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Check for pending message on authentication state change
  useEffect(() => {
    // Only run this effect when user becomes authenticated
    if (isSignedIn) {
      const pendingMessage = localStorage.getItem(PENDING_MESSAGE_KEY)

      if (pendingMessage) {
        // Retrieve and clear the pending message
        localStorage.removeItem(PENDING_MESSAGE_KEY)

        // Set the message in state and trigger submission
        setMessage(pendingMessage)
        createChat(pendingMessage)
      }
    }
  }, [isSignedIn])

  // Extract chat creation logic to a separate function
  const createChat = async (messageToSend: string) => {
    if (!messageToSend.trim() || isCreating) return

    try {
      setIsCreating(true)
      // Create a new chat
      const chat = await chatApi.createChat()

      // Add the first message
      await chatApi.addMessage(chat.id, messageToSend, "user")

      // Redirect to the chat page
      router.push(`/chat/${chat.id}`)
    } catch (error) {
      setIsCreating(false)
    }
  }

  const handleSubmit = async () => {
    if (!message.trim() || isCreating) return

    // Check if user is authenticated
    if (!isSignedIn) {
      // Save message to localStorage before opening auth dialog
      localStorage.setItem(PENDING_MESSAGE_KEY, message)

      // Open Clerk sign-in modal directly
      openSignIn()
      return
    }

    // User is already authenticated, create the chat
    await createChat(message)
  }

  return (
    <div className="container max-w-[700px] mx-auto px-4">
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">
          Create a Custom UI Component
        </h1>
        <p className="text-muted-foreground mb-2">
          Describe the UI component you want to create, inspired by the work of
          21st.dev creators
        </p>
      </div>

      <PromptInput onSubmit={handleSubmit} className="w-full">
        <PromptInputTextarea
          placeholder="Describe your UI component idea..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isCreating}
        />
        <PromptInputActions className="justify-end pt-2">
          <PromptInputAction
            tooltip={
              isCreating ? "Creating component..." : "Generate component"
            }
          >
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleSubmit}
              disabled={isCreating}
            >
              {isCreating ? (
                <Square className="size-5 fill-current" />
              ) : (
                <ArrowUp className="size-5" />
              )}
            </Button>
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>
    </div>
  )
}
