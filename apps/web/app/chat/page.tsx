import { Header } from "@/components/ui/header.client"
import { Footer } from "@/components/ui/footer"
import { ChatClient } from "./page.client"

export default function ChatPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <ChatClient />
      </main>
      <Footer />
    </div>
  )
}
