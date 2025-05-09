"use client"

import { useState } from "react"
import { useId } from "react"
import { Globe, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface VisibilityToggleProps {
  isPrivate: boolean
  onToggle?: (isPrivate: boolean) => Promise<void>
  disabled?: boolean
  readonly?: boolean
}

export function VisibilityToggle({
  isPrivate,
  onToggle,
  disabled = false,
  readonly = false,
}: VisibilityToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false)
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
            "bg-zinc-900 rounded-md px-2 py-1 flex items-center gap-1.5 text-xs",
            !isPrivate && "text-green-500",
          )}
        >
          {isPrivate ? <Lock size={12} /> : <Globe size={12} />}
          <span>{isPrivate ? "Private" : "Public"}</span>
        </div>
      </div>
    )
  }

  // Editable dropdown
  return (
    <Select
      value={isPrivate ? "private" : "public"}
      onValueChange={handleVisibilityChange}
      disabled={disabled || isUpdating}
    >
      <SelectTrigger
        id={id}
        className="bg-zinc-900 border-0 rounded-md w-[100px] h-7 focus:ring-0 text-xs px-2"
      >
        <SelectValue placeholder="Visibility">
          <div
            className={cn(
              "flex items-center gap-2",
              !isPrivate && "text-green-500",
            )}
          >
            {isPrivate ? <Lock size={12} className="min-w-3 min-h-3" /> : <Globe size={12} className="min-w-3 min-h-3" />}
            <span>{isPrivate ? "Private" : "Public"}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-zinc-900 border-zinc-800">
        <SelectItem
          value="public"
          className={cn("cursor-pointer text-xs", !isPrivate && "text-green-500")}
        >
          <div className="flex items-center gap-1.5">
            <Globe size={12} className="min-w-3 min-h-3" />
            <span>Public</span>
          </div>
        </SelectItem>
        <SelectItem value="private" className="cursor-pointer text-xs">
          <div className="flex items-center gap-1.5">
            <Lock size={12} className="min-w-3 min-h-3" />
            <span>Private</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
