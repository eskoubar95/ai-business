import { headers } from "next/headers";

/**
 * Public origin for absolute URLs (webhooks, share links).
 * Prefer `NEXT_PUBLIC_APP_URL` when set; otherwise derive from request headers.
 */
export async function getPublicOrigin(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}
