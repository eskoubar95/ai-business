import { auth } from "@/lib/auth/server";

/** Current Neon Auth session user id, or throws `Unauthorized`. */
export async function requireSessionUserId(): Promise<string> {
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") {
    throw new Error("Unauthorized");
  }
  return userId;
}
