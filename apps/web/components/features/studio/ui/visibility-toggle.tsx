"use client"

import { useState } from "react"
import { useId } from "react"
import { CheckIcon, ChevronDownIcon, Globe, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface VisibilityToggleProps {
  isPrivate: boolean
  onToggle?: (isPrivate: boolean) => Promise<void>
  disabled?: boolean
  readonly?: boolean
}

const visibilityOptions = [
  {
    value: "public",
    label: "Public",
    icon: Globe,
    className: "text-green-500",
  },
  {
    value: "private",
    label: "Private",
    icon: Lock,
    className: "",
  },
]

export function VisibilityToggle({
  isPrivate,
  onToggle,
  disabled = false,
  readonly = false,
}: VisibilityToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [open, setOpen] = useState(false)
  const id = useId()

  const handleVisibilityChange = async (value: string) => {
    if (!onToggle || readonly) return

    try {
      setIsUpdating(true)
      await onToggle(value === "private")
    } catch (error) {
      console.error("Failed to update visibility:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Read-only view
  if (readonly) {
    return (
      <div className="flex items-center">
        <div
          className={cn(
            "bg-muted text-muted-foreground rounded-md px-2 py-1 flex items-center gap-1.5 text-xs",
            !isPrivate && "text-green-500",
          )}
        >
          {isPrivate ? <Lock size={12} /> : <Globe size={12} />}
          <span>{isPrivate ? "Private" : "Public"}</span>
        </div>
      </div>
    )
  }

  const currentValue = isPrivate ? "private" : "public"
  const currentOption = visibilityOptions.find(
    (option) => option.value === currentValue,
  )

  // Editable dropdown with search
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isUpdating}
          className="bg-card text-card-foreground border-border rounded-md w-[100px] h-7 focus:ring-0 text-xs px-2 justify-between shadow-none"
        >
          <div
            className={cn(
              "flex items-center gap-2",
              !isPrivate && "text-green-500",
            )}
          >
            {isPrivate ? (
              <Lock size={12} className="min-w-3 min-h-3" />
            ) : (
              <Globe size={12} className="min-w-3 min-h-3" />
            )}
            <span>{isPrivate ? "Private" : "Public"}</span>
          </div>
          <ChevronDownIcon
            size={14}
            className="text-muted-foreground/80 shrink-0"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="bg-popover text-popover-foreground border-border w-[160px] p-0"
        align="start"
      >
        <Command className="text-xs">
          <CommandInput placeholder="Search..." className="text-xs h-7 py-1" />
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {visibilityOptions.map((option) => {
                const Icon = option.icon
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(value) => {
                      handleVisibilityChange(value)
                      setOpen(false)
                    }}
                    className={cn(
                      "cursor-pointer text-xs py-1",
                      option.value === "public" && "text-green-500",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon size={12} className="min-w-3 min-h-3" />
                      <span>{option.label}</span>
                    </div>
                    {currentValue === option.value && (
                      <CheckIcon size={14} className="ml-auto" />
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
