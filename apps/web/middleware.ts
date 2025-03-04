import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isProtectedRoute = createRouteMatcher(["/publish(.*)", "/settings(.*)"])

export default clerkMiddleware(async (auth, request) => {
  if (process.env.MAINTENANCE_MODE === "true") {
    return NextResponse.rewrite(new URL("/maintenance", request.url))
  }
  if (request.nextUrl.pathname.startsWith("/magic/get-started")) {
    return NextResponse.redirect(new URL("/magic/onboarding", request.url))
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-internal-token", process.env.INTERNAL_API_SECRET!)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  if (isProtectedRoute(request)) {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.redirect(
        new URL(process.env.AUTH_URL_SIGN_IN!, request.url),
      )
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
