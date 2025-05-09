"use client"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import posthog from "posthog-js"
import { initPostHog } from "@/lib/posthog"

const RECORDED_ROUTES = ["/studio", "/publish"]

export default function SessionRecorder() {
  const pathname = usePathname()

  useEffect(initPostHog, [])

  useEffect(() => {
    try {
      const shouldRecord = RECORDED_ROUTES.some((route) =>
        pathname.startsWith(route),
      )

      if (shouldRecord) {
        posthog.startSessionRecording()
      } else {
        posthog.stopSessionRecording()
      }

      posthog.capture("$pageview", { url: pathname })
    } catch (error) {
      console.error("Error recording session", error)
    }
  }, [pathname])

  return null
}
