"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { PromptRule } from "@/types/prompt-rules"
import { usePromptRules } from "@/hooks/use-prompt-rules"

interface PromptRuleSelectorProps {
  value?: number
  onChange: (value: number | undefined) => void
}

export function PromptRuleSelector({
  value,
  onChange,
}: PromptRuleSelectorProps) {
  const [open, setOpen] = useState(false)
  const { data: promptRules, isLoading } = usePromptRules()

  const selectedRule = promptRules?.find((rule) => rule.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value && selectedRule
            ? selectedRule.name
            : "Select prompt rule..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search rules..." />
          <CommandEmpty>
            {isLoading ? "Loading..." : "No rules found."}
          </CommandEmpty>
          <CommandGroup>
            {promptRules?.map((rule) => (
              <CommandItem
                key={rule.id}
                value={rule.name}
                onSelect={() => {
                  onChange(rule.id === value ? undefined : rule.id)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === rule.id ? "opacity-100" : "opacity-0",
                  )}
                />
                {rule.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
