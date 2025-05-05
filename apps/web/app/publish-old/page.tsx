import React from "react"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs"
import PublishComponentForm from "@/components/features/publish/publish-layout"
import { Metadata } from "next"

import { Header } from "@/components/ui/header.client"

export const metadata: Metadata = {
  title: "Publish New Component | 21st.dev",
}

export default function PublishPage() {
  return (
    <>
      <SignedIn>
        <Header variant="publish" />
        <div className="flex flex-row items-center h-screen w-full">
          <PublishComponentForm />
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
