"use client"

import React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePromptRules } from "@/hooks/use-prompt-rules"

interface PromptRuleSelectorProps {
  value?: number
  onChange: (value: number | undefined) => void
}

export function PromptRuleSelector({
  value,
  onChange,
}: PromptRuleSelectorProps) {
  const { data: promptRules, isLoading } = usePromptRules()

  const selectedRule = promptRules?.find((rule) => rule.id === value)

  if (isLoading) {
    return (
      <SelectTrigger className="w-full" disabled>
        <SelectValue placeholder="Loading..." />
      </SelectTrigger>
    )
  }

  return (
    <Select
      value={value?.toString()}
      onValueChange={(value) => onChange(value ? parseInt(value) : undefined)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select prompt rule...">
          {selectedRule?.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {promptRules?.map((rule) => (
          <SelectItem key={rule.id} value={rule.id.toString()}>
            <div className="flex items-center gap-2">
              <span>{rule.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
