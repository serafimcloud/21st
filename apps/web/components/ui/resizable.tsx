"use client"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"
import { DragHandleDots2Icon } from "@radix-ui/react-icons"

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className,
    )}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "relative flex items-center justify-center bg-border",
      "w-[1px]",
      "before:absolute before:content-[''] before:inset-y-0 before:-left-3 before:-right-3 before:z-10",
      "after:absolute after:content-[''] after:inset-y-0 after:w-[1px] after:bg-border hover:after:w-[3px] hover:after:bg-primary after:transition-all after:duration-200 after:z-20",
      "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
      "data-[panel-group-direction=vertical]:after:h-[1px] data-[panel-group-direction=vertical]:after:inset-x-0 data-[panel-group-direction=vertical]:hover:after:h-[3px]",
      "[&[data-panel-group-direction=vertical]>div]:rotate-90",
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <DragHandleDots2Icon className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
