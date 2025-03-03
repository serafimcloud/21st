import { supabaseWithAdminAccess } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Получаем асинхронные params
    const resolvedParams = await params
    const demoId = parseInt(resolvedParams.id)
    console.log("Checking bundle status for demo ID:", demoId)

    if (isNaN(demoId)) {
      return NextResponse.json({ error: "Invalid demo ID" }, { status: 400 })
    }

    const { data, error } = await supabaseWithAdminAccess
      .from("demos")
      .select("has_bundle, bundle_js_url, bundle_css_url, bundle_html_url")
      .eq("id", demoId)
      .single()

    if (error) {
      console.error("Error fetching bundle status:", error)
      return NextResponse.json(
        { error: "Failed to fetch bundle status" },
        { status: 500 },
      )
    }

    if (!data) {
      return NextResponse.json({ error: "Demo not found" }, { status: 404 })
    }

    return NextResponse.json({
      hasBundle: !!data.has_bundle,
      urls: data.has_bundle
        ? {
            jsUrl: data.bundle_js_url,
            cssUrl: data.bundle_css_url,
            htmlUrl: data.bundle_html_url,
          }
        : undefined,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
