import { supabaseWithAdminAccess } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = supabaseWithAdminAccess

  const { data: missingItems, error } = await supabase.rpc(
    "get_missing_usage_embedding_items",
  )

  if (error) {
    console.error("Error fetching missing items:", error)
    return NextResponse.json(
      { error: "Failed to fetch missing items", details: error.message },
      { status: 500 },
    )
  }

  // Generate embeddings for missing items
  for (const item of missingItems) {
    console.log("Generating embeddings for item:", item)
    const { data, error } = await supabase.functions.invoke(
      "generate-embeddings",
      {
        body: {
          type: item.item_type,
          id: item.item_id,
        },
      },
    )

    console.log("Response:", data)

    if (error) {
      console.error("Error generating embeddings:", error)
      return NextResponse.json(
        { error: "Failed to generate embeddings", details: error.message },
        { status: 500 },
      )
    }
  }

  return NextResponse.json(missingItems)
}
