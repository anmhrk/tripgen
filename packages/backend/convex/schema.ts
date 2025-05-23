import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  trips: defineTable({
    routeId: v.string(),
    userId: v.id("users"),
    title: v.string(),
    createdAt: v.number(),
    prompt: v.string(),
    status: v.union(
      v.literal("created"),
      v.literal("collecting_details"),
      v.literal("generating_plan"),
      v.literal("generating_itinerary"),
      v.literal("completed"),
      v.literal("failed")
    ),
  }),
});
