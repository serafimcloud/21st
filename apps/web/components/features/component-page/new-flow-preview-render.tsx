import { Demo } from "@/types/global"
import { useTheme } from "next-themes"
import { motion } from "motion/react"
import { FullScreenButton } from "../../ui/full-screen-button"
import { LoadingSpinner } from "../../ui/loading-spinner"
import React, { useState } from "react"

export function NewFlowPreviewRender({ demo }: { demo: Demo }) {
  const { resolvedTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)

  return (
    <motion.div className="relative flex-grow h-full rounded-lg overflow-hidden">
      <FullScreenButton />
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center h-full gap-3 bg-background/80">
          <LoadingSpinner />
          <p className="text-muted-foreground text-sm">Loading preview...</p>
        </div>
      )}
      <iframe
        src={`${demo.bundle_html_url}?theme=${resolvedTheme}`}
        className="w-full h-full"
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)} // Optionally handle error differently
      />
    </motion.div>
  )
}
