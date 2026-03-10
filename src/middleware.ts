/**
 * Next.js Middleware for Authentication & Authorization
 *
 * Security Notes:
 * - Runs on EVERY request before route handlers
 * - Validates session cookie existence for protected routes
 * - Redirects unauthenticated users to login
 * - Full auth validation happens in server components/actions
 *
 * Note: We check for session cookie only (not full validation)
 * to avoid Edge Runtime compatibility issues with better-auth telemetry
 */

import { NextRequest, NextResponse } from "next/server";

// Session cookie name (must match auth.ts config)
const SESSION_COOKIE = "crmdev.session";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/api/webhooks",
  "/accept-invitation",
  "/support",
];

// Static assets and API routes to skip
const SKIP_ROUTES = [
  "/_next",
  "/favicon.ico",
  "/api/health",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and internal routes
  if (SKIP_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for session cookie (lightweight check)
  const sessionCookie = request.cookies.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    // No session cookie - redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes protection - verify superadmin
  if (pathname.startsWith("/admin")) {
    // Import auth dynamically for Edge Runtime compatibility
    const { auth } = await import("@/lib/auth");

    // Get full session to verify superadmin status
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.isSuperAdmin) {
      // Not a superadmin - redirect to regular dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Session cookie exists - allow request
  // Full auth validation happens in server components/actions
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
