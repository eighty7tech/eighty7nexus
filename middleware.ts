import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale } from "@/config/i18n.config";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract the locale if present (e.g., /en/admin -> /admin)
  const segments = pathname.split("/");
  const hasLocale = segments[1] && segments[1].length === 2;
  const pathWithoutLocale = hasLocale ? `/${segments.slice(2).join("/")}` : pathname;
  const locale = hasLocale ? segments[1] : defaultLocale;

  // Protect these routes at the edge
  const isProtected = pathWithoutLocale.startsWith("/admin") || pathWithoutLocale.startsWith("/pos");

  if (isProtected) {
    const cookieHeader = request.headers.get("cookie") || "";
    
    // Quick optimization: if there's no better-auth cookie at all, they aren't signed in
    if (!cookieHeader.includes("better-auth.session_token")) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    // Call our Node.js API to retrieve and verify the session securely.
    // This bridges the Edge runtime middleware with our MongoDB-backed Better Auth.
    try {
      const sessionResponse = await fetch(new URL("/api/auth/get-session", request.url).toString(), {
        headers: {
          cookie: cookieHeader,
        },
        // Edge caches fetch by default in some Next.js versions, ensure we always check fresh
        cache: "no-store", 
      });

      if (!sessionResponse.ok) {
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
      }

      const sessionData = await sessionResponse.json();
      
      // If no valid session object is returned, they are unauthenticated
      if (!sessionData || !sessionData.session) {
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
      }
      
      // Here you can also extend edge protection to check roles if necessary:
      // if (pathWithoutLocale.startsWith("/admin") && sessionData.user.role !== "ADMIN") { ... }
      
    } catch (error) {
      // If fetch fails (e.g. timeout), let the server components handle the final authorization
      // to prevent locking out users on temporary network blips.
      console.error("[Middleware] Edge session check failed:", error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
