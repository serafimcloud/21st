/**
 * Attribution tracking utility
 *
 * This utility provides functions to track user attribution data
 * for subscription conversions using localStorage.
 */

// Attribution sources
export const ATTRIBUTION_SOURCE = {
  MAGIC: "magic",
  COMPONENT_LIBRARY: "component_library",
  SETTINGS: "settings",
  HEADER: "header",
} as const

export type AttributionSource =
  (typeof ATTRIBUTION_SOURCE)[keyof typeof ATTRIBUTION_SOURCE]

// Attribution details
export const SOURCE_DETAIL = {
  // Magic MCP sources
  MAGIC_HEADER: "magic_header",
  MAGIC_LANDING_HERO: "magic_landing_hero",
  MAGIC_CONSOLE: "magic_console",
  MAGIC_ONBOARDING: "magic_onboarding",

  // Component Library sources
  PREMIUM_COMPONENT_CTA: "premium_component_cta",

  // Settings sources
  SETTINGS_BILLING: "settings_billing",

  // Header sources
  HEADER_GET_PRO_LINK: "header_get_pro_link",
} as const

export type SourceDetail = (typeof SOURCE_DETAIL)[keyof typeof SOURCE_DETAIL]

/**
 * Track an attribution event by storing it in localStorage
 */
export function trackAttribution(
  source: AttributionSource,
  detail: SourceDetail,
): void {
  try {
    if (typeof window === "undefined") return

    localStorage.setItem("attribution_source", source)
    localStorage.setItem("attribution_detail", detail)
    localStorage.setItem("attribution_timestamp", Date.now().toString())
  } catch (error) {
    console.error("Error storing attribution data:", error)
  }
}

/**
 * Get current attribution data from localStorage
 */
export function getAttributionData(): {
  source: string | null
  detail: string | null
  timestamp: string | null
} {
  if (typeof window === "undefined") {
    return { source: null, detail: null, timestamp: null }
  }

  return {
    source: localStorage.getItem("attribution_source"),
    detail: localStorage.getItem("attribution_detail"),
    timestamp: localStorage.getItem("attribution_timestamp"),
  }
}

/**
 * Clear attribution data from localStorage
 */
export function clearAttributionData(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem("attribution_source")
  localStorage.removeItem("attribution_detail")
  localStorage.removeItem("attribution_timestamp")
}

/**
 * Set default attribution if none exists
 */
export function setDefaultAttribution(
  source: AttributionSource,
  detail: SourceDetail,
): void {
  if (typeof window === "undefined") return

  const currentSource = localStorage.getItem("attribution_source")
  const currentDetail = localStorage.getItem("attribution_detail")

  if (!currentSource || !currentDetail) {
    trackAttribution(source, detail)
  }
}
