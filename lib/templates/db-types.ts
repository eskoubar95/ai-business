/** Drizzle DB instance returned by {@link import("@/db/index").getDb}. */
export type AppDb = ReturnType<typeof import("@/db/index").getDb>;
