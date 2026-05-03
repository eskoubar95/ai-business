import { type NextRequest, NextResponse } from "next/server";

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
    return NextResponse.next();
  }
  // JSON POSTs to Grill-Me API routes hit the same middleware edge case; routes call
  // `auth.getSession()` and `assertUserBusinessAccess` themselves.
  if (
    request.method === "POST" &&
    request.nextUrl.pathname.startsWith("/api/grill-me")
  ) {
    return NextResponse.next();
  }
  return withAuth(request);
}

export const config = {
  matcher: [
    "/account/:path*",
    "/dashboard/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/api/protected/:path*",
    "/api/grill-me/:path*",
  ],
};
