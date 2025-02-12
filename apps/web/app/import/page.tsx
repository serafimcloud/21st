import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs"
import { Metadata } from "next"
import { Header } from "@/components/ui/header.client"
import ImportPageClient from "./page.client"

export const metadata: Metadata = {
  title: "Import Component | 21st.dev",
}

export default function ImportPage() {
  return (
    <>
      <SignedIn>
        <Header variant="publish" />
        <div className="flex flex-row items-center h-screen w-full">
          <ImportPageClient />
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
