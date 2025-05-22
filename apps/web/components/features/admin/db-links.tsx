"use client"

import { useIsAdmin } from "@/components/features/publish/hooks/use-is-admin"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ExternalLink } from "lucide-react"

export const DbLinks = ({
  componentId,
  demoId,
}: {
  componentId?: number
  demoId?: number
}) => {
  const isAdmin = useIsAdmin()
  if (!isAdmin) {
    return null
  }

  const componentSupabaseUrl = componentId
    ? `https://supabase.com/dashboard/project/vucvdpamtrjkzmubwlts/editor/29179?sort=created_at%3Adesc&filter=id%3Aeq%3A${componentId}`
    : undefined
  let demoSupabaseUrl = demoId
    ? `https://supabase.com/dashboard/project/vucvdpamtrjkzmubwlts/editor/229472?filter=id%3Aeq%3A${demoId}`
    : undefined

  if (!demoSupabaseUrl && componentId) {
    demoSupabaseUrl = `https://supabase.com/dashboard/project/vucvdpamtrjkzmubwlts/editor/229472?sort=created_at:desc&filter=component_id:eq:${componentId}`
  }

  // Prevent click event bubbling when used inside a clickable parent
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild className="shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={!componentSupabaseUrl}
            >
              <a href={componentSupabaseUrl} target="_blank">
                <ExternalLink size={16} className="text-blue-600" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Open Component in Supabase</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild className="shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={!demoSupabaseUrl}
            >
              <a href={demoSupabaseUrl} target="_blank">
                <ExternalLink size={16} className="text-green-600" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Open Demo in Supabase</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
