import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { NextRequest, NextFetchEvent } from "next/server"

export function middleware(request: NextRequest) {
  const isMaintenance = process.env.MAINTENANCE_MODE === "true"

  if (isMaintenance && !request.nextUrl.pathname.startsWith("/_next")) {
    return NextResponse.rewrite(new URL("/maintenance", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/:path*",
}
