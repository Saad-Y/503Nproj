import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if the user is accessing a protected route
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard")

  // Check if the user has the authentication cookie
  const token = request.cookies.get("learnify-token")

  // If it's a protected route and the user doesn't have a token, redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/auth", request.url))
  }

  // If the user is trying to access the auth page but already has a token, redirect to dashboard
  if (request.nextUrl.pathname === "/auth" && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/dashboard/:path*", "/auth"],
}
