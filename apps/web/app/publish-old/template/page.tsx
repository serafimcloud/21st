import React from "react"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs"
import { PublishTemplateForm } from "@/components/features/publish/template/publish-template-form"
import { Metadata } from "next"
import { Header } from "@/components/ui/header.client"

export const metadata: Metadata = {
  title: "Publish New Template | 21st.dev",
  description: "Create and publish a new template",
}

export default function PublishTemplatePage() {
  return (
    <>
      <SignedIn>
        <header className="flex fixed top-0 left-0 right-0 h-14 z-30 items-center px-4 py-3 text-foreground border-b border-border/40 bg-background">
          <Header />
        </header>
        <div className="flex flex-row items-center h-screen w-full">
          <PublishTemplateForm />
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
