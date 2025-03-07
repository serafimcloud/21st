import { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { PromptRuleForm } from "@/components/features/prompt-rules/prompt-rule-form"
import { getPromptRule } from "@/lib/queries"
import { supabaseWithAdminAccess } from "@/lib/supabase"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export const metadata: Metadata = {
  title: "Edit Rules",
  description: "Edit an existing rule",
}

export default async function EditPromptRulePage(props: PageProps) {
  const params = await props.params
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const promptRuleId = parseInt(params.id)

  if (isNaN(promptRuleId)) {
    notFound()
  }

  const promptRule = await getPromptRule(supabaseWithAdminAccess, promptRuleId)

  if (!promptRule || promptRule.user_id !== userId) {
    notFound()
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

      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-sm font-medium">Edit AI Rule</h2>
          <p className="text-xs text-muted-foreground mt-1">
            For questions about AI rules,{" "}
            <a
              href="mailto:support@21st.dev"
              className="underline hover:text-primary"
            >
              contact us
            </a>
          </p>
        </div>
      </div>

      <PromptRuleForm
        userId={userId}
        promptRule={promptRule}
        isEditing={true}
      />
    </div>
  )
}
