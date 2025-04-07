import { toast } from "sonner"
import { defaultGlobalCss, defaultTailwindConfig } from "@/lib/defaults"

/**
 * Merges tailwind config and global CSS from dependencies
 *
 * @param styles Array of style objects containing tailwindConfig and globalCss
 */
export async function mergeStyles(
  styles: { tailwindConfig?: string; globalCss?: string }[],
) {
  const customTailwindConfigs = styles
    .map((s) => s.tailwindConfig)
    .filter((config): config is string => !!config)

  const customGlobalCssStyles = styles
    .map((s) => s.globalCss)
    .filter((css): css is string => !!css)

  // Prepare result object
  const result: {
    tailwindConfig: string
    globalCss: string
  } = {
    tailwindConfig: defaultTailwindConfig,
    globalCss: defaultGlobalCss,
  }

  // Track each file loading state individually
  const tailwindConfigPromise =
    customTailwindConfigs.length > 0
      ? (async () => {
          console.log("[mergeStyles] Started merging tailwind config")

          try {
            const response = await fetch("/api/studio/merge-styles/tailwind", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                defaultConfig: defaultTailwindConfig,
                dependencyConfigs: customTailwindConfigs,
              }),
            })

            const data = await response.json()
            result.tailwindConfig = data.tailwindConfig || defaultTailwindConfig

            console.log("[mergeStyles] Completed merging tailwind config")
            return data
          } catch (error) {
            console.error("Error merging tailwind config:", error)
            toast.error("Failed to merge tailwind config")
            return { tailwindConfig: defaultTailwindConfig }
          }
        })()
      : Promise.resolve({ tailwindConfig: defaultTailwindConfig })

  const globalCssPromise =
    customGlobalCssStyles.length > 0
      ? (async () => {
          console.log("[mergeStyles] Started merging global CSS")

          try {
            const response = await fetch("/api/studio/merge-styles/globals", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                defaultGlobalCss: defaultGlobalCss,
                dependencyGlobalCss: customGlobalCssStyles,
              }),
            })

            const data = await response.json()
            result.globalCss = data.globalCss || defaultGlobalCss

            console.log("[mergeStyles] Completed merging global CSS")
            return data
          } catch (error) {
            console.error("Error merging global CSS:", error)
            toast.error("Failed to merge global CSS")
            return { globalCss: defaultGlobalCss }
          }
        })()
      : Promise.resolve({ globalCss: defaultGlobalCss })

  // Wait for both promises to complete
  await Promise.all([tailwindConfigPromise, globalCssPromise])

  return result
}
