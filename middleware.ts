import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/admin-key", "/scoreboard", "/api/auth/login", "/api/auth/key"]

  // Check if the route is public
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Protected admin routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/secret-admin-portal")) {
    const token = request.cookies.get("auth-token")?.value
    const adminKey = request.cookies.get("admin-key")?.value

    // Only check presence of at least one auth cookie here (Edge runtime)
    if (!token && !adminKey) {
      return NextResponse.redirect(new URL("/admin-key", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)"],
}
