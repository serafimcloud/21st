import posthog from "posthog-js"

export function initPostHog() {
  if (typeof window === "undefined") return

  posthog.init(process.env.POSTHOG_PUBLIC_KEY!, {
    api_host: "https://us.i.posthog.com",
    disable_session_recording: true,
    autocapture: false,
    capture_pageview: false,
  })
}
