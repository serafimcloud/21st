import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { PromptRuleForm } from "@/components/features/prompt-rules/prompt-rule-form"

export const metadata: Metadata = {
  title: "Create AI Rule",
  description: "Create a new AI rule for your prompts",
}

export default async function NewPromptRulePage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link href="/settings/rules">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft size={16} />
            Back to Rules
          </Button>
        </Link>
      </div>

      <div>
        <h3 className="text-lg font-medium">Create AI Rule</h3>
        <p className="text-sm text-muted-foreground">
          Create a new rule to customize AI prompts with your project context
        </p>
      </div>

      <PromptRuleForm userId={userId} />
    </div>
  )
}
