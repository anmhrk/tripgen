import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { TRPCError } from "@trpc/server";
import { trips } from "~/server/db/schema";
import { formSchema } from "~/lib/zod-schemas";
import { eq } from "drizzle-orm";

export const tripRouter = createTRPCRouter({
  createTripFromPrompt: protectedProcedure
    .input(z.object({ prompt: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const response = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: z.object({
          valid: z.boolean(),
          name: z.string().optional(),
        }),
        system: `
        You are a helpful assistant that validates prompts and generates a name for trip planning.
        If the prompt looks valid to help plan a trip, return a valid object with the boolean set to true and a name for the trip.
        If the prompt does not look valid, return a valid object with the boolean set to false and an empty string for the name.
        Something that looks like a valid prompt: "I want to go to London for 1 week".
        `,
        prompt: input.prompt,
      });

      if (!response.object.valid || !response.object.name) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide a valid trip planning prompt",
        });
      }

      const tripId = crypto.randomUUID();

      await ctx.db.insert(trips).values({
        id: tripId,
        userId: ctx.session.user.id,
        name: response.object.name,
        user_submitted_data: {
          prompt: input.prompt,
          startDate: null,
          endDate: null,
          numTravelers: null,
          budgetRange: null,
          startLocation: null,
          destination: null,
          travelStyle: null,
          accommodation: null,
          activities: null,
          specialRequirements: null,
        },
      });

      return { tripId };
    }),

  createTripFromForm: protectedProcedure
    .input(formSchema)
    .mutation(async ({ ctx, input }) => {
      const tripId = crypto.randomUUID();

      await ctx.db.insert(trips).values({
        id: tripId,
        userId: ctx.session.user.id,
        name: input.tripName,
        user_submitted_data: {
          prompt: null,
          startDate: input.startDate,
          endDate: input.endDate,
          numTravelers: input.numTravelers,
          budgetRange: input.budgetRange,
          startLocation: input.startLocation,
          destination: input.destination,
          travelStyle: input.travelStyle,
          accommodation: input.accommodation,
          activities: input.activities ?? null,
          specialRequirements: input.specialRequirements ?? null,
        },
      });

      return { tripId };
    }),

  // also validates trip page access
  getTripName: publicProcedure
    .input(z.object({ tripId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const trip = await ctx.db.query.trips.findFirst({
        where: eq(trips.id, input.tripId),
      });

      if (!trip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "The trip you are looking for does not exist",
        });
      }

      if (trip.userId !== ctx.session?.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not allowed to access this trip",
        });
      }

      return trip.name;
    }),
});
