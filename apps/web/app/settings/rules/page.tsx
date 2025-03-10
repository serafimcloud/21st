import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

import { Button } from "@/components/ui/button"
import { PromptRulesList } from "@/components/features/prompt-rules/prompt-rules-list"
import { getPromptRules } from "@/lib/queries"
import { supabaseWithAdminAccess } from "@/lib/supabase"

export const metadata: Metadata = {
  title: "AI Rules",
  description: "Manage your AI prompt rules and context",
}

export default async function PromptRulesPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const promptRules = await getPromptRules(supabaseWithAdminAccess, userId)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-sm font-medium">AI Rules</h2>
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
        <Button asChild>
          <Link href="/settings/rules/new">Create New Rule</Link>
        </Button>
      </div>

      <PromptRulesList promptRules={promptRules} />
    </div>
  )
}
