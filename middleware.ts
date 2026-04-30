import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: [
    "/account/:path*",
    "/dashboard/:path*",
    "/api/protected/:path*",
    "/api/grill-me/:path*",
  ],
};
