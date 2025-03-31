import { Header } from "@/components/ui/header.client"
import { Footer } from "@/components/ui/footer"
import { ChatClient } from "./page.client"
import { ChatContainer } from "@/components/ui/chat-container"

interface ChatPageProps {
  params: {
    id: string
  }
}

export default function ChatPage({ params }: ChatPageProps) {
  const chatId = params.id

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col">
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
