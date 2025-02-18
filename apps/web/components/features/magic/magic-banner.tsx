"use client"

import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { Wand2, X } from "lucide-react"
import { useAtom } from "jotai"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { memo } from "react"
import { atomWithStorage } from "jotai/utils"

export const magicBannerVisibleAtom = atomWithStorage(
  "magic-banner-visible",
  true,
)

const MagicBannerContent = memo(function MagicBannerContent() {
  const [isVisible, setIsVisible] = useAtom(magicBannerVisibleAtom)
  const router = useRouter()

  return (
    <AnimatePresence mode="popLayout">
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            duration: 0.2,
            ease: "easeInOut",
          }}
          className="fixed inset-x-0 top-14 z-50 border-b border-border bg-muted overflow-hidden"
        >
          <Banner variant="muted" className="dark text-foreground">
            <div className="flex w-full gap-2 md:items-center">
              <div className="flex grow gap-3 md:items-center">
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 max-md:mt-0.5"
                  aria-hidden="true"
                >
                  <Wand2 className="opacity-80" size={16} strokeWidth={2} />
                </div>
                <div className="flex grow flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      Introducing Magic - MCP Agent
                    </p>
                    <p className="text-sm text-muted-foreground">
                      A powerful new integration with Cursor that helps you
                      craft components with AI precision.
                    </p>
                  </div>
                  <div className="flex gap-2 max-md:flex-wrap">
                    <Button
                      size="sm"
                      className="text-sm"
                      onClick={() => router.push("/magic")}
                    >
                      Try Magic Now
                    </Button>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
                onClick={() => setIsVisible(false)}
                aria-label="Close banner"
              >
                <X
                  size={16}
                  strokeWidth={2}
                  className="opacity-60 transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                />
              </Button>
            </div>
          </Banner>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

export function MagicBanner() {
  return <MagicBannerContent />
}
