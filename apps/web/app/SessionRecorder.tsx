"use client"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import posthog from "posthog-js"
import { initPostHog } from "@/lib/posthog"

const RECORDED_ROUTES = ["/studio"]

export default function SessionRecorder() {
  const pathname = usePathname()

  useEffect(initPostHog, [])

  useEffect(() => {
    const shouldRecord = RECORDED_ROUTES.some((route) =>
      pathname.startsWith(route),
    )

    if (shouldRecord) {
      console.log("RECORDING")
      console.log("RECORDING")
      console.log("RECORDING")
      console.log("RECORDING")
      posthog.startSessionRecording()
    } else {
      console.log("STOP RECORDING")
      console.log("STOP RECORDING")
      console.log("STOP RECORDING")
      console.log("STOP RECORDING")
      posthog.stopSessionRecording()
    }

    posthog.capture("$pageview", { url: pathname })
  }, [pathname])

  return null
}
