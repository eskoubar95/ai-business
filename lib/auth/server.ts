import { createNeonAuth } from "@neondatabase/auth/next/server";

/** Placeholders allow `next build` without real Neon Auth; override in deployment. */
const buildTimeBaseUrl =
  process.env.NEON_AUTH_BASE_URL ?? "https://build.invalid";
const buildTimeCookieSecret =
  process.env.NEON_AUTH_COOKIE_SECRET ?? "build-time-placeholder-secret-32-chars-min";

export const auth = createNeonAuth({
  baseUrl: buildTimeBaseUrl,
  cookies: {
    secret: buildTimeCookieSecret,
  },
});
