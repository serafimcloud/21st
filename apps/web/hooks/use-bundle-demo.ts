import { useState } from "react"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useMutation } from "@tanstack/react-query"
import type { Tables } from "@/types/supabase"

export interface BundleDemoResult {
  success: boolean
  urls: {
    jsUrl: string
    cssUrl: string
    htmlUrl: string
  }
  bundleReady: boolean
  error?: string
  details?: string
}

export interface BundleResult {
  id: string
  status: string
  cdnUrl?: string
  error?: string
  urls?: {
    js?: string
    css?: string
    html?: string
  }
}

export function useBundleDemo() {
  const client = useClerkSupabaseClient()
  const [error, setError] = useState<string | null>(null)
  const [isBundling, setIsBundling] = useState(false)
  const [bundleResult, setBundleResult] = useState<BundleResult | null>(null)

  const bundleMutation = useMutation({
    mutationFn: async ({
      code,
      demoCode,
      componentSlug,
      demoSlug,
      dependencies,
      demoDependencies,
      demoId,
      baseTailwindConfig,
      globalCss,
      uiComponents,
    }: {
      code: string
      demoCode: string
      componentSlug: string
      demoSlug: string
      dependencies: Record<string, string>
      demoDependencies: Record<string, string>
      demoId: number
      baseTailwindConfig?: string
      globalCss?: string
      uiComponents?: Record<string, string> // Path -> content of UI components
    }): Promise<BundleResult> => {
      setError(null)

      try {
        setIsBundling(true)

        // Extract referenced UI components
        const extractedComponents = uiComponents || {}

        // Find imports with @ alias in the code (simplistic, for demo purposes)
        const importRegex = /@\/components\/ui\/(\w+)/g
        const componentImports = new Set<string>()

        let match
        while ((match = importRegex.exec(code)) !== null) {
          componentImports.add(match[0])
        }

        // Reset regex and search in demo code
        importRegex.lastIndex = 0
        while ((match = importRegex.exec(demoCode)) !== null) {
          componentImports.add(match[0])
        }

        console.log(
          "Detected UI component imports:",
          Array.from(componentImports),
        )

        // Call backend to bundle the component
        const backendUrl = "http://localhost:80"
        console.log("🔄 Backend URL:", backendUrl)

        const response = await fetch(`${backendUrl}/bundle-demo`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            demoCode,
            componentSlug,
            demoSlug,
            dependencies,
            demoDependencies,
            baseTailwindConfig,
            globalCss,
            uiComponents: extractedComponents,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Bundle creation error:", errorText)
          const errorResult = {
            id: "",
            status: "error",
            error: `HTTP Error: ${response.status} - ${errorText}`,
          }
          setBundleResult(errorResult)
          return errorResult
        }

        const result = await response.json()
        console.log("Bundle result:", result)

        const bundleResult = {
          id: result.id || "",
          status: "success",
          cdnUrl: result.cdnUrl || "",
          urls: {
            js: result.jsUrl || "",
            css: result.cssUrl || "",
            html: result.htmlUrl || "",
          },
        }

        setBundleResult(bundleResult)

        if (result.success && result.bundleReady) {
          // Update the demo record in Supabase with bundle URLs
          const { error: updateError } = await client
            .from("demos")
            .update({
              has_bundle: true,
              bundle_js_url: result.urls.jsUrl,
              bundle_css_url: result.urls.cssUrl,
              bundle_html_url: result.urls.htmlUrl,
            })
            .eq("id", demoId)

          if (updateError) {
            console.error("Failed to update demo record:", updateError)
            throw updateError
          }
        }

        return bundleResult
      } catch (error) {
        console.error("Bundle error:", error)
        const errorResult = {
          id: "",
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        }
        setBundleResult(errorResult)
        return errorResult
      } finally {
        setIsBundling(false)
      }
    },
  })

  return {
    bundleDemo: bundleMutation.mutateAsync,
    isBundling: bundleMutation.isPending,
    error,
    bundleResult: bundleMutation.data,
  }
}

export async function hasBundleGenerated(demoId: number): Promise<boolean> {
  const response = await fetch(`/api/demos/${demoId}/bundle-status`)
  const data = await response.json()
  return data.hasBundle
}

export type BundleStatus = {
  hasBundle: boolean
  urls?: {
    jsUrl: string
    cssUrl: string
    htmlUrl: string
  }
}

export async function getBundleStatus(demoId: number): Promise<BundleStatus> {
  const response = await fetch(`/api/demos/${demoId}/bundle-status`)
  return await response.json()
}
