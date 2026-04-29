import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** Core tenant — onboarding, memory, agents, teams attach here. */
export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
