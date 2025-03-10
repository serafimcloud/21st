import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export type PurchaseComponentError =
  | { type: "INSUFFICIENT_TOKENS"; message: string }
  | { type: "COMPONENT_NOT_FOUND"; message: string }
  | { type: "ALREADY_PURCHASED"; message: string }
  | { type: "NO_USAGE_DATA"; message: string }
  | { type: "DATABASE_ERROR"; message: string }
  | { type: "UNAUTHORIZED"; message: string }

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: "UNAUTHORIZED",
            message: "You must be logged in to purchase components",
          },
        },
        { status: 401 },
      )
    }

    const { componentId } = await req.json()
    if (!componentId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: "DATABASE_ERROR",
            message: "Component ID is required",
          },
        },
        { status: 400 },
      )
    }

    const { data, error } = await supabase.rpc("purchase_component", {
      p_user_id: userId,
      p_component_id: componentId,
    })

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: "DATABASE_ERROR",
            message: error.message,
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          type: "DATABASE_ERROR",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      },
      { status: 500 },
    )
  }
}
