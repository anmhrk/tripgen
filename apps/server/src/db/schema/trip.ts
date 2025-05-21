import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const tripStatus = pgEnum("status", [
  "created",
  "collecting_details",
  "generating_plan",
  "complete",
  "failed",
]);

export const trip = pgTable("trip", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull(),
  status: tripStatus("status").default("created"),
});
