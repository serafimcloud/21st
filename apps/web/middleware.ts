import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { NextRequest, NextFetchEvent } from "next/server"

export default function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-internal-token", process.env.INTERNAL_API_SECRET!)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return clerkMiddleware(request, event)
}

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)", 
    "/(api|trpc)(.*)",
  ],
}
