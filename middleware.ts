import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";

const withAuth = auth.middleware({
  loginUrl: "/auth/sign-in",
});

export default function middleware(request: NextRequest) {
  // Server Actions POST to the document URL with a `Next-Action` header. Neon Auth's
  // middleware can 307 to sign-in for those POSTs even when GET sees a session, which
  // breaks the action protocol ("unexpected response"). Server Actions still enforce
  // auth inside `auth.getSession()` (e.g. `createBusiness`).
  if (request.method === "POST" && request.headers.has("next-action")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", request.nextUrl.pathname);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }
  // JSON POSTs to Grill-Me API routes hit the same middleware edge case; routes call
  // `auth.getSession()` and `assertUserBusinessAccess` themselves.
  if (
    request.method === "POST" &&
    request.nextUrl.pathname.startsWith("/api/grill-me")
  ) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", request.nextUrl.pathname);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Forward pathname so `app/dashboard/layout.tsx` can require onboarding when the user
  // has no businesses (without a large route-group file move).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  const forward = new NextRequest(request, { headers: requestHeaders });
  return withAuth(forward);
}

export const config = {
  matcher: [
    "/account/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/api/protected/:path*",
    "/api/grill-me/:path*",
  ],
};
