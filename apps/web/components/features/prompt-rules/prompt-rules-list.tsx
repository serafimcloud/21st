"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Code, Palette } from "lucide-react"
import { useClerkSupabaseClient } from "@/lib/clerk"

import { PromptRule } from "@/types/prompt-rules"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deletePromptRule } from "@/lib/queries"
import { toast } from "sonner"

interface PromptRulesListProps {
  promptRules: PromptRule[]
}

export function PromptRulesList({ promptRules }: PromptRulesListProps) {
  const router = useRouter()
  const supabase = useClerkSupabaseClient()
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    setIsDeleting(true)
    try {
      await deletePromptRule(supabase, id)
      toast.success("Rule deleted successfully")
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete rule")
      console.error(error)
    } finally {
      setIsDeleting(false)
      setSelectedRuleId(null)
    }
  }

  if (promptRules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-medium">No rules created yet</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Create your first AI rule to enhance your prompts
        </p>
        <Button asChild>
          <Link href="/settings/rules/new">Create New Rule</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-1 rounded-md border bg-card">
      {promptRules.map((rule) => (
        <div
          key={rule.id}
          className="flex items-center justify-between p-4 hover:bg-accent/50"
        >
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{rule.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(rule.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Code className="h-4 w-4" />
                <div className="flex flex-wrap gap-1">
                  {rule.tech_stack.length > 0 ? (
                    rule.tech_stack.map((tech, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tech.name} {tech.version && `(${tech.version})`}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs">No tech stack specified</span>
                  )}
                </div>
                {Object.keys(rule.theme).length > 0 && (
                  <>
                    <Palette className="ml-2 h-4 w-4" />
                    <span className="text-xs">Custom theme</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/settings/rules/${rule.id}`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => rule.id && handleDelete(rule.id)}
              >
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  )
}
