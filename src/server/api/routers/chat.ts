import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { trips } from "~/server/db/schema";

export const chatRouter = createTRPCRouter({
  getMessages: publicProcedure
    .input(
      z.object({
        tripId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const trip = await ctx.db.query.trips.findFirst({
        where: eq(trips.id, input.tripId),
      });

      if (!trip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      return trip.messages;
    }),
});
