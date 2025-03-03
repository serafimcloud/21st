import { useState } from "react"

export interface BundleInput {
  name: string
  code: string
  demoCode: string
  componentSlug: string
  demoSlug: string
  registryDependencies: Record<string, string>
  packageJson: {
    dependencies: Record<string, string>
  }
}

export interface BundleResult {
  id?: string
  status: "success" | "error"
  cdnUrl?: string
  error?: string
}

export function useBundleGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [bundleResult, setBundleResult] = useState<BundleResult | null>(null)

  const generateBundle = async (input: BundleInput): Promise<BundleResult> => {
    try {
      setIsGenerating(true)

      // Используем локальный бэкенд для генерации бандла
      const backendUrl = "http://localhost:80"
      console.log("🔄 Backend URL:", backendUrl)

      const response = await fetch(`${backendUrl}/bundle-demo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: input.code,
          demoCode: input.demoCode,
          componentSlug: input.componentSlug,
          demoSlug: input.demoSlug,
          dependencies: input.packageJson.dependencies,
          uiComponents: input.registryDependencies,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Ошибка создания бандла:", errorText)
        const result = {
          status: "error" as const,
          error: `HTTP Error: ${response.status} - ${errorText}`,
        }
        setBundleResult(result)
        return result
      }

      const data = await response.json()
      console.log("Результат создания бандла:", data)

      const result = {
        id: data.id,
        status: "success" as const,
        cdnUrl: data.cdnUrl || "",
      }

      setBundleResult(result)
      return result
    } catch (error) {
      console.error("Ошибка генерации бандла:", error)
      const result = {
        status: "error" as const,
        error: error instanceof Error ? error.message : String(error),
      }
      setBundleResult(result)
      return result
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    generateBundle,
    isGenerating,
    bundleResult,
  }
}
