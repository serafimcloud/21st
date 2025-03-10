import { useEffect, useState, useRef } from "react"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { Component, Tag, User } from "@/types/global"
import { defaultTailwindConfig } from "@/lib/sandpack"
import { defaultGlobalCss } from "@/lib/sandpack"

interface BundleUrls {
  html: string
  js?: string
  css?: string
}

export const useBundleDemo = (
  files: Record<string, string>,
  dependencies: Record<string, string>,
  component: Component & { user: User } & { tags: Tag[] },
  shellCode: string[],
  demoId: number,
  tailwindConfig?: string,
  globalCss?: string,
  existingBundleUrls?: BundleUrls | null,
) => {
  const [bundleUrls, setBundleUrls] = useState<BundleUrls | null>(
    existingBundleUrls ?? null,
  )

  const prevDepsRef = useRef({
    files: null as Record<string, string> | null,
    dependencies: null as Record<string, string> | null,
    tailwindConfig: null as string | undefined | null,
    globalCss: null as string | undefined | null,
    componentId: null as number | null,
    demoId: null as number | null,
  })

  useEffect(() => {
    if (bundleUrls) return
    if (!shellCode) return

    const prevDeps = prevDepsRef.current
    const filesChanged =
      JSON.stringify(prevDeps.files) !== JSON.stringify(files)
    const depsChanged =
      JSON.stringify(prevDeps.dependencies) !== JSON.stringify(dependencies)
    const tailwindChanged = prevDeps.tailwindConfig !== tailwindConfig
    const cssChanged = prevDeps.globalCss !== globalCss
    const componentChanged = prevDeps.componentId !== component.id
    const demoIdChanged = prevDeps.demoId !== demoId

    const changedDeps = {
      files: filesChanged,
      dependencies: depsChanged,
      tailwindConfig: tailwindChanged,
      globalCss: cssChanged,
      component: componentChanged,
      demoId: demoIdChanged,
    }

    console.log("Bundle dependencies changed:", changedDeps)

    prevDepsRef.current = {
      files,
      dependencies,
      tailwindConfig,
      globalCss,
      componentId: component.id,
      demoId,
    }

    // Skip fetch if this isn't the first run and nothing has changed
    const isFirstRun = prevDeps.files === null
    const hasChanges = Object.values(changedDeps).some((changed) => changed)

    if (!isFirstRun && !hasChanges) {
      console.log("Skipping fetch - no changes detected")
      return
    }

    console.log("Fetching bundle - changes detected or first run")

    // Use the new API endpoint
    fetch(`/api/bundle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
          console.log("Bundle URLs received:", Object.keys(data))
          setBundleUrls(data)
          return data
        }
      })
      .catch((error) => {
        console.error("Error in bundle generation:", error)
      })
  }, [
    files,
    dependencies,
    tailwindConfig,
    globalCss,
    component,
    shellCode,
    demoId,
    bundleUrls,
  ])

  return bundleUrls
}
