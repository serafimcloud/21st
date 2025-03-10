"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BookText, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { usePromptRules } from "@/hooks/use-prompt-rules"

export function PromptRuleDisplay() {
  const [selectedRuleId, setSelectedRuleId] = useState<number | undefined>(
    () => {
      // Initialize from localStorage if available
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("selectedPromptRuleId")
        return saved ? parseInt(saved, 10) : undefined
      }
      return undefined
    },
  )

  const { data: promptRules, isLoading } = usePromptRules()
  const selectedRule = promptRules?.find((rule) => rule.id === selectedRuleId)

  // Save to localStorage when selectedRuleId changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedRuleId) {
        localStorage.setItem("selectedPromptRuleId", selectedRuleId.toString())
      } else {
        localStorage.removeItem("selectedPromptRuleId")
      }
    }
  }, [selectedRuleId])

  const handleRuleChange = (ruleId: number | undefined) => {
    setSelectedRuleId(ruleId)
  }

  return (
    <div className="flex flex-col space-y-2 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookText className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-medium">Prompt Rules</h3>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/settings/rules">
            <Settings className="h-4 w-4 mr-1" />
            Manage
          </Link>
        </Button>
      </div>

      <div className="mt-2">
        <select
          className="w-full p-2 border rounded-md"
          value={selectedRuleId || ""}
          onChange={(e) =>
            handleRuleChange(
              e.target.value ? parseInt(e.target.value, 10) : undefined,
            )
          }
        >
          <option value="">Select a rule...</option>
          {promptRules?.map((rule) => (
            <option key={rule.id} value={rule.id}>
              {rule.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2 mt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : selectedRule ? (
        <div className="space-y-2 mt-2">
          {selectedRule.tech_stack.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Tech Stack:
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedRule.tech_stack.map((tech, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tech.name} {tech.version && `(${tech.version})`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {Object.keys(selectedRule.theme).length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Theme:
              </p>
              <Badge variant="outline" className="text-xs">
                Custom theme configured
              </Badge>
            </div>
          )}

          {selectedRule.additional_context && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Additional Context:
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedRule.additional_context.length > 100
                  ? `${selectedRule.additional_context.substring(0, 100)}...`
                  : selectedRule.additional_context}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mt-2">
          No rule selected. Select a rule to enhance AI code generation with
          your project context.
        </p>
      )}
    </div>
  )
}
