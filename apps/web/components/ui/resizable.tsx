"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface ResizablePanelGroupProps
  extends React.HTMLAttributes<HTMLDivElement> {
  direction: "horizontal" | "vertical"
  children: React.ReactNode
}

interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultSize?: number
  minSize?: number
  children: React.ReactNode
}

const ResizableContext = createContext<{
  direction: "horizontal" | "vertical"
}>({
  direction: "horizontal",
})

export function ResizablePanelGroup({
  direction,
  className,
  children,
  ...props
}: ResizablePanelGroupProps) {
  return (
    <ResizableContext.Provider value={{ direction }}>
      <div
        className={cn(
          "flex",
          direction === "horizontal" ? "flex-row" : "flex-col",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </ResizableContext.Provider>
  )
}

export function ResizablePanel({
  defaultSize = 50,
  minSize = 10,
  className,
  children,
  ...props
}: ResizablePanelProps) {
  const { direction } = useContext(ResizableContext)
  const [size, setSize] = useState(defaultSize)

  return (
    <div
      className={cn("relative", className)}
      style={{
        [direction === "horizontal" ? "width" : "height"]: `${size}%`,
        [direction === "horizontal" ? "minWidth" : "minHeight"]: `${minSize}%`,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export function ResizableHandle() {
  const { direction } = useContext(ResizableContext)

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-border",
        direction === "horizontal"
          ? "w-[6px] cursor-col-resize h-full"
          : "h-[6px] cursor-row-resize w-full",
      )}
    >
      <div
        className={cn(
          "bg-muted-foreground rounded-full",
          direction === "horizontal" ? "w-1 h-12" : "h-1 w-12",
        )}
      />
    </div>
  )
}
