import { NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import crypto from "crypto"
import { defaultTailwindConfig, defaultGlobalCss } from "@/lib/sandpack"

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

    // Check if we already have a bundle with this hash
    const { data: demo, error: demoError } = await supabaseWithAdminAccess
      .from("demos")
      .select("bundle_html_url, bundle_hash")
      .eq("id", demoId)
      .single()

    // If we have a cached bundle with the same hash, return it
    if (
      !demoError &&
      demo &&
      demo.bundle_hash === contentHash &&
      demo.bundle_html_url
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
