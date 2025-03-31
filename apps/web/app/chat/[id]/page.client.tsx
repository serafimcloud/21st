"use client"

import { useEffect, useState } from "react"
import { PromptInput, PromptInputTextarea } from "@/components/ui/prompt-input"
import { Loader } from "@/components/ui/loader"
import { chatApi } from "@/lib/chat-service"
import type { Chat } from "@/app/api/chat/[id]/route"
import { useRouter } from "next/navigation"
import { notFound } from "next/navigation"

// Добавляем компонент для отладки состояния
function DebugPanel({
  generating,
  prompt,
  generated,
  logMessages = [],
}: {
  generating: boolean
  prompt: string
  generated: boolean
  logMessages?: string[]
}) {
  const [expanded, setExpanded] = useState(false)
  const [logs, setLogs] = useState<string[]>(logMessages)

  // Сохраняем логи в состоянии
  useEffect(() => {
    // Функция для перехвата console.log
    const originalLog = console.log
    console.log = (...args) => {
      originalLog(...args)
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg),
        )
        .join(" ")

      setLogs((prev) => [...prev, message].slice(-20)) // Держим последние 20 логов
    }

    return () => {
      console.log = originalLog
    }
  }, [])

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-4 right-4 bg-black text-white p-2 rounded-md z-50"
      >
        Debug ({generating ? "Loading" : "Idle"})
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-md z-50 w-96 max-h-96 overflow-auto">
      <div className="flex justify-between mb-2">
        <h3 className="font-bold">Debug Panel</h3>
        <button onClick={() => setExpanded(false)}>Close</button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
        <div>
          Status:{" "}
          <span className={generating ? "text-yellow-400" : "text-green-400"}>
            {generating ? "GENERATING" : "IDLE"}
          </span>
        </div>
        <div>
          Component:{" "}
          <span className={generated ? "text-green-400" : "text-gray-400"}>
            {generated ? "GENERATED" : "NOT GENERATED"}
          </span>
        </div>
      </div>

      {prompt && (
        <div className="mb-2 text-xs">
          <div className="font-bold">Current Prompt:</div>
          <div className="bg-gray-800 p-1 rounded">{prompt}</div>
        </div>
      )}

      <div className="text-xs mt-2">
        <div className="font-bold">Last Logs:</div>
        <div className="bg-gray-800 p-1 rounded h-32 overflow-y-auto">
          {logs.length > 0 ? (
            logs.map((log, i) => (
              <div key={i} className="border-b border-gray-700 py-1">
                {log}
              </div>
            ))
          ) : (
            <div className="text-gray-500">No logs yet</div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ChatClientProps {
  chatId: string
}

const logToWindow = (message: string) => {
  if (typeof window !== "undefined") {
    window.console.log(
      "%c CHAT LOG: " + message,
      "background: #222; color: #bada55",
    )
  }
}

export function ChatClient({ chatId }: ChatClientProps) {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [chat, setChat] = useState<Chat | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState("")
  const [componentGenerated, setComponentGenerated] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [minLoadingTimeElapsed, setMinLoadingTimeElapsed] = useState(false)
  const DEBUG = true

  useEffect(() => {
    console.log("ChatClient mounted with chatId:", chatId)

    async function loadChat() {
      try {
        console.log(`ChatClient: Fetching chat data for ID: ${chatId}`)

        if (DEBUG) {
          const testResponse = await fetch(`/api/chat/${chatId}`)
          console.log(`Test fetch status:`, testResponse.status)
          console.log(
            `Test fetch headers:`,
            Object.fromEntries(testResponse.headers.entries()),
          )
        }

        const chatData = await chatApi.getChat(chatId)
        console.log(
          `ChatClient: Chat data received:`,
          chatData ? "success" : "null",
        )

        if (!chatData) {
          console.error("ChatClient: No chat data returned")
          notFound()
        }

        setChat(chatData)
        console.log(
          `ChatClient: Chat data set in state, with ${chatData.messages?.length || 0} messages`,
        )

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
              console.log(
                `ChatClient: Simulating generation process for existing prompt`,
              )

              let progress = 0
              const progressInterval = setInterval(() => {
                progress += 15
                setGenerationProgress(progress)

                if (progress >= 100) {
                  clearInterval(progressInterval)
                  setTimeout(() => {
                    setGenerating(false)
                    setComponentGenerated(true)
                    console.log(
                      `ChatClient: Finished simulating generation process`,
                    )
                  }, 500)
                }
              }, 300)

              console.log(
                `ChatClient: Found previous user prompt: "${userMessage.content.substring(0, 30)}..."`,
              )
            }
          }
        }
      } catch (error) {
        console.error("ChatClient: Failed to load chat:", error)
      } finally {
        setLoading(false)
        console.log("ChatClient: Loading state set to false")
      }
    }

    loadChat()

    return () => {
      console.log("ChatClient unmounting")
    }
  }, [chatId])

  const handleSubmit = async () => {
    if (!message.trim() || generating) return

    try {
      console.log("🔵 [UI] Starting component generation process...")
      logToWindow("🔵 [UI] Starting component generation process...")

      setGenerating(true)
      setGenerationProgress(0)
      setMinLoadingTimeElapsed(false)
      logToWindow("🔵 [UI] Set generating state: true")

      setComponentGenerated(false)
      logToWindow("🔵 [UI] Set componentGenerated state: false")

      const promptText = message
      setCurrentPrompt(promptText)
      logToWindow("🔵 [UI] Set current prompt: " + promptText)

      setMessage("")
      logToWindow("🔵 [UI] Cleared input field")

      logToWindow("🔵 [UI] Adding user message to chat...")
      await chatApi.addMessage(chatId, promptText, "user")
      logToWindow("🔵 [UI] User message added to chat")

      setTimeout(() => {
        setMinLoadingTimeElapsed(true)
        logToWindow("🔵 [UI] Minimum loading time elapsed")
      }, 3000)

      logToWindow("🔵 [UI] Starting component generation process...")

      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          const newProgress = prev + 5
          return newProgress > 90 ? 90 : newProgress
        })
      }, 500)

      const generatedComponent = await chatApi.generateComponent(promptText, {
        theme: "light",
        complexity: "medium",
      })

      logToWindow(
        `🔵 [UI] Component generated: ${JSON.stringify(generatedComponent.metadata)}`,
      )

      setGenerationProgress(95)
      await new Promise((resolve) => setTimeout(resolve, 500))
      setGenerationProgress(100)
      await new Promise((resolve) => setTimeout(resolve, 500))

      clearInterval(progressInterval)

      logToWindow("🔵 [UI] Component generation completed")

      logToWindow("🔵 [UI] Adding assistant response to chat...")
      await chatApi.addMessage(
        chatId,
        "I've generated a UI component based on your request.",
        "assistant",
      )
      logToWindow("🔵 [UI] Assistant response added to chat")

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

      // Reload chat data and mark as complete
      logToWindow("🔵 [UI] Reloading chat data...")
      const updatedChat = await chatApi.getChat(chatId)
      setChat(updatedChat)
      logToWindow("🔵 [UI] Chat data reloaded")

      setComponentGenerated(true)
      logToWindow("🔵 [UI] Set componentGenerated state: true")
    } catch (error) {
      console.error("🔴 [UI] Failed to generate component:", error)
      logToWindow("🔴 [UI] Failed to generate component: " + String(error))
    } finally {
      // Ensure generating state is active for at least 3 seconds
      if (!minLoadingTimeElapsed) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }

      setGenerating(false)
      setGenerationProgress(0)
      logToWindow("🔵 [UI] Set generating state back to: false")
      logToWindow("🔵 [UI] Component generation process completed")
    }
  }

  // Initial loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Debug panel */}
      <DebugPanel
        generating={generating}
        prompt={currentPrompt}
        generated={componentGenerated}
      />

      {/* Top area: user prompt with shimmer effect during generation */}
      {currentPrompt && (
        <div className="py-6 text-center">
          <div key="static-mode" className="animate-in fade-in duration-300">
            <h2 className="text-xl font-medium max-w-2xl mx-auto">
              {currentPrompt}
            </h2>
          </div>
        </div>
      )}

      {/* Middle area: component preview or loading state */}
      <div className="flex-1 mx-4 mb-4">
        {!generating && (
          <div className="flex h-full items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg">
            {componentGenerated ? (
              <div className="text-center p-6">
                <h3 className="text-lg font-medium mb-2">Component Preview</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Here's your generated component based on the prompt above. You
                  can modify it using the input field below.
                </p>
              </div>
            ) : (
              <div className="text-center p-6">
                <h3 className="text-lg font-medium mb-2">Component Preview</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Describe the UI component you want to build in the input field
                  below. Once generated, the preview will appear here.
                </p>
              </div>
            )}
          </div>
        )}
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
