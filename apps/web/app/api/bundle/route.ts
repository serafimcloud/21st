import { hasUserPurchasedDemo } from "@/lib/api/server/demos"
import {
  resolveRegistryDependenciesV2,
  transformToFlatDependencyTree,
} from "@/lib/registry"
import { defaultGlobalCss, defaultTailwindConfig } from "@/lib/sandpack"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { auth } from "@clerk/nextjs/server"
import crypto from "crypto"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const {
      files,
      id,
      dependencies,
      baseTailwindConfig,
      baseGlobalCss,
      customTailwindConfig,
      customGlobalCss,
    } = await request.json()

    if (!files || !id) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      )
    }

    const demoId = typeof id === "string" ? parseInt(id) : id

    // Check if we already have a bundle with this hash
    const { data: demo, error: demoError } = await supabaseWithAdminAccess
      .from("demos")
      .select(
        `
        *,
        component:components(*),
        user:users(username)
      `,
      )
      .eq("id", demoId)
      .single()

    if (demoError) {
      console.error("Error fetching demo:", demoError)
      return NextResponse.json(
        { error: "Error fetching demo", details: demoError },
        { status: 500 },
      )
    }

    const resolvedComponentRegistryDependencies =
      await resolveRegistryDependenciesV2(
        demo?.component?.direct_registry_dependencies as string[],
      )

    const resolvedDemoRegistryDependencies =
      await resolveRegistryDependenciesV2(
        demo?.demo_direct_registry_dependencies as string[],
      )

    const resolvedDependencies = transformToFlatDependencyTree({
      ...resolvedComponentRegistryDependencies,
      ...resolvedDemoRegistryDependencies,
    })

    Object.keys(resolvedDependencies).forEach((key) => {
      Object.entries(resolvedDependencies[key]!.dependencies).forEach(
        ([key, value]) => {
          dependencies[key] = value
        },
      )
    })

    for (const key in resolvedDependencies) {
      const filePath = `/components/ui/${resolvedDependencies[key]!.componentSlug}.tsx`
      files[filePath] = resolvedDependencies[key]!.code
    }

    console.log("files", files)
    console.log("dependencies", dependencies)

    // Generate a unique hash for this bundle
    const contentHash = crypto
      .createHash("md5")
      .update(
        JSON.stringify({
          files,
          dependencies,
          customTailwindConfig,
          customGlobalCss,
        }),
      )
      .digest("hex")

    const { userId } = await auth()
    const isPurchased = await hasUserPurchasedDemo(userId, demoId)

    // If we have a cached bundle with the same hash, return it
    // Force cache if not purchased
    if (
      (!demoError &&
        demo &&
        demo.bundle_hash === contentHash &&
        demo.bundle_html_url) ||
      !isPurchased
    ) {
      return NextResponse.json({
        html: demo.bundle_html_url,
        fromCache: true,
      })
    }

    // Call backend bundle serverless function
    const bundleResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/bundle`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files,
          id: demoId,
          dependencies,
          baseTailwindConfig: baseTailwindConfig || defaultTailwindConfig,
          baseGlobalCss: baseGlobalCss || defaultGlobalCss,
          customTailwindConfig,
          customGlobalCss,
        }),
      },
    )

    if (!bundleResponse.ok) {
      const errorText = await bundleResponse.text()
      console.error("Error from bundle service:", errorText)
      return NextResponse.json(
        { error: "Failed to generate bundle", details: errorText },
        { status: 500 },
      )
    }

    const bundleData = await bundleResponse.json()

    // Update the demo with the new bundle URL and hash
    if (demoId) {
      const { error: updateError } = await supabaseWithAdminAccess
        .from("demos")
        .update({
          bundle_html_url: bundleData.html,
          bundle_hash: contentHash,
        })
        .eq("id", demoId)

      if (updateError) {
        console.error("Error updating demo with bundle URL:", updateError)
      }
    }

    return NextResponse.json(bundleData)
  } catch (error) {
    console.error("Error in bundle generation:", error)
    return NextResponse.json(
      { error: "Failed to generate bundle", details: String(error) },
      { status: 500 },
    )
  }
}
