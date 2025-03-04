import { useEffect, useState } from "react"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { Component, Tag, User } from "@/types/global"
import { defaultTailwindConfig } from "@/lib/sandpack"
import { defaultGlobalCss } from "@/lib/sandpack"


interface BundleUrls {
  html: string
  js: string
  css: string
}

export const useBundleDemo = (
  files: Record<string, string>,
  dependencies: Record<string, string>,
  component: Component & { user: User } & { tags: Tag[] },
  shellCode: string[],
  demoId: number,
  demoSlug: string,
  tailwindConfig?: string,
  globalCss?: string,
  existingBundleUrls?: BundleUrls | null,
) => {
  const client = useClerkSupabaseClient()
  const [bundleUrls, setBundleUrls] = useState<BundleUrls | null>(
    existingBundleUrls ?? null,
  )

  useEffect(() => {
    if (bundleUrls) return
    if (!shellCode) return

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/bundle`, {
      method: "POST",
      body: JSON.stringify({
        files,
        id: demoId,
        dependencies,
        baseTailwindConfig: defaultTailwindConfig,
        baseGlobalCss: defaultGlobalCss,
        customTailwindConfig: tailwindConfig,
        customGlobalCss: globalCss,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          throw new Error(data.error)
        } else {
          setBundleUrls(data)
          return data
        }
      })
      .then(async (bundle: BundleUrls) => {
        if (component.id && demoId) {
          const { data: existingDemo, error: checkError } = await client
            .from("demos")
            .select("id, component_id")
            .eq("id", demoId)

          if (checkError || !existingDemo || existingDemo.length === 0) {
            return
          }

          const { error: updateError } = await client
            .from("demos")
            .update({
              bundle_html_url: bundle.html,
              bundle_js_url: bundle.js,
              bundle_css_url: bundle.css,
            })
            .eq("id", demoId)
            .eq("component_id", component.id)

          if (updateError) {
            console.error(
              "Failed to update demo with bundle URLs:",
              updateError,
            )
          }
        }
      })
      .catch((error) => {
        console.error("Error in bundle generation or upload:", error)
      })
  }, [
    files,
    dependencies,
    tailwindConfig,
    globalCss,
    component,
    shellCode,
    demoId,
  ])

  return bundleUrls
}
