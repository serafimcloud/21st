import { Header } from "@/components/ui/header.client"
import { Footer } from "@/components/ui/footer"
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

  // Debugging for server-side rendering
  console.log("Rendering chat page with ID:", chatId)

  // Using the resolved params
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col">
        {/* Debugger with resolved params */}
        <div className="fixed top-0 left-0 right-0 bg-yellow-200 text-black p-2 z-50 text-sm text-center">
          DEBUG: Chat ID: {chatId}
        </div>

        <div className="container mx-auto py-4 pt-20 h-full">
          <div className="w-full h-[calc(100vh-160px)]">
            <ChatContainer className="h-full">
              <div className="flex flex-col h-full">
                <ChatClient chatId={chatId} />
              </div>
            </ChatContainer>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
