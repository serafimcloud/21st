import { Header } from "@/components/ui/header.client"
import { ChatClient } from "./page.client"
import { ChatContainer } from "@/components/ui/chat-container"

interface ChatPageProps {
  params: Promise<{
    id: string
  }>
}

// Changed to async function to properly await params
export default async function ChatPage({ params }: ChatPageProps) {
  // Await the params object
  const resolvedParams = await params
  const chatId = resolvedParams.id

  if (!chatId) {
    throw new Error("Chat ID is required")
  }

  // Using the resolved params
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex flex-col">
        <div className="px-4 h-full">
          <div className="w-full h-[calc(100vh-16px)]">
            <ChatContainer className="h-full">
              <div className="flex flex-col h-full">
                <ChatClient chatId={chatId} />
              </div>
            </ChatContainer>
          </div>
        </div>
      </main>
    </div>
  )
}
