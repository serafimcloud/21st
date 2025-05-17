"use client"

import { Icons } from "@/components/icons"
import { usePromptRules } from "@/hooks/use-prompt-rules"
import { promptOptions, type PromptOptionBase } from "@/lib/prompts"
import { PromptType } from "@/types/global"
import { Loader2, Plus } from "lucide-react"
import Link from "next/link"
import React, { useEffect, useId } from "react"
import { toast } from "sonner"
import { Button } from "./button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog"
import { Label } from "./label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select"
import { Textarea } from "./textarea"

interface CopyPromptDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedPromptType: PromptType
  onPromptTypeChange: (value: PromptType) => void
  onCopyPrompt: (ruleId?: number, context?: string) => void
  demoId: string
}

const STORAGE_KEY = "lastSelectedPromptRule"

export function CopyPromptDialog({
  isOpen,
  onClose,
  selectedPromptType,
  onPromptTypeChange,
  onCopyPrompt,
  demoId,
}: CopyPromptDialogProps) {
  const promptTypeId = useId()
  const promptRuleId = useId()
  const [selectedRuleId, setSelectedRuleId] = React.useState<
    number | undefined
  >(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? parseInt(saved) : undefined
    }
    return undefined
  })
  const [additionalContext, setAdditionalContext] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const { data: promptRules, isLoading: isLoadingRules } = usePromptRules()
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (selectedRuleId) {
      localStorage.setItem(STORAGE_KEY, selectedRuleId.toString())
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [selectedRuleId])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 0)
    }
  }, [isOpen])

  const handleCopy = async () => {
    try {
      setIsLoading(true)
      await onCopyPrompt(selectedRuleId, additionalContext || undefined)
      onClose()
    } catch (error) {
      console.error("Error in handleCopy:", error)
      toast.error(
        error instanceof Error ? error.message : "Error generating prompt",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setAdditionalContext("")
    onClose()
  }

  const promptTypeOptions = React.useMemo(
    () =>
      promptOptions.filter(
        (option): option is PromptOptionBase => option.type === "option",
      ),
    [],
  )

  const selectedOption = React.useMemo(
    () => promptTypeOptions.find((opt) => opt.id === selectedPromptType),
    [promptTypeOptions, selectedPromptType],
  )

  const selectedRule = React.useMemo(
    () => promptRules?.find((rule) => rule.id === selectedRuleId),
    [promptRules, selectedRuleId],
  )

  // Add useEffect for Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      // Check if any select element is focused
      const activeElement = document.activeElement
      const isSelectFocused =
        activeElement?.closest('[role="combobox"]') !== null

      // Check if the event target is within this specific dialog
      const isWithinCopyDialog =
        (e.target as HTMLElement)?.closest(
          '[data-dialog-type="copy-prompt"]',
        ) !== null

      if (e.key === "Enter" && !isSelectFocused && isWithinCopyDialog) {
        e.preventDefault()
        handleCopy()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen]) // Add isOpen to dependencies

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[500px]"
        data-dialog-type="copy-prompt"
      >
        <DialogHeader>
          <DialogTitle>Copy AI Prompt</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          {/* Prompt Type Selection */}
          <div className="space-y-2">
            <Label htmlFor={promptTypeId}>Prompt Type</Label>
            <Select
              defaultValue={selectedPromptType}
              onValueChange={onPromptTypeChange}
            >
              <SelectTrigger id={promptTypeId}>
                <SelectValue placeholder="Select prompt type">
                  {selectedOption && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-[22px] h-[22px]">
                        {selectedOption.icon}
                      </div>
                      <span>{selectedOption.label}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
                {promptTypeOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-[22px] h-[22px]">
                        {option.icon}
                      </div>
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prompt Rule Selection */}
          <div className="space-y-2">
            <Label htmlFor={promptRuleId}>Prompt Rule</Label>
            <Select
              value={selectedRuleId?.toString() || "default"}
              onValueChange={(value) =>
                setSelectedRuleId(
                  value && value !== "default" ? parseInt(value) : undefined,
                )
              }
              disabled={isLoadingRules}
            >
              <SelectTrigger id={promptRuleId}>
                <SelectValue placeholder="Select prompt rule (optional)" />
              </SelectTrigger>
              <SelectContent className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
                <SelectGroup>
                  <SelectItem value="default">
                    <span>Default (no custom rules)</span>
                  </SelectItem>
                  {isLoadingRules ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    promptRules?.map((rule) => (
                      <SelectItem key={rule.id} value={rule.id.toString()}>
                        <span>{rule.name}</span>
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <Link
                    href="/settings/rules/new"
                    target="_blank"
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Add new rule</span>
                  </Link>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Context */}
          <div className="space-y-2">
            <Label htmlFor="additional-context">Additional Context</Label>
            <Textarea
              id="additional-context"
              ref={textareaRef}
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Add any additional context for the AI..."
              className="h-[100px]"
              autoFocus
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleCopy}
              variant="default"
              className="pr-1.5"
              disabled={isLoading || isLoadingRules}
            >
              {isLoading || isLoadingRules ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Copy Prompt
                  <kbd className="pointer-events-none h-5 w-5 justify-center select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-kbd leading-none opacity-100 flex">
                    <Icons.enter className="h-2.5 w-2.5" />
                  </kbd>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
