import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { TRPCError } from "@trpc/server";
import { trips, itineraries } from "~/server/db/schema";
import { formSchema } from "~/lib/types";
import { eq, and, sql } from "drizzle-orm";

export const tripRouter = createTRPCRouter({
  createTripFromPrompt: protectedProcedure
    .input(z.object({ prompt: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const response = await generateObject({
        model: openai("gpt-4o"),
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
        all_details_collected: true,
      });

      return { tripId };
    }),

  // Also validates trip page access, and shared user access
  getTripDataOnLoad: publicProcedure
    .input(
      z.object({
        tripId: z.string().min(1),
        sharePhrase: z.string().optional(),
      }),
    )
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

      const tripData = {
        isShared: trip.is_shared,
        isOwner: trip.userId === ctx.session?.user.id,
        name: trip.name,
        firstMessage: "",
        allDetailsCollected: trip.all_details_collected,
      };

      if (trip.messages.length === 0) {
        if (trip.user_submitted_data?.prompt) {
          tripData.firstMessage = trip.user_submitted_data.prompt;
        } else {
          tripData.firstMessage = `Please help me plan a trip. Here are the details:
         ${Object.entries(trip.user_submitted_data ?? {})
           .filter(([key]) => key !== "prompt")
           .map(([key, value]) => {
             if (key === "startDate" || key === "endDate") {
               return `${key}: ${new Date(value as string).toLocaleDateString(
                 "en-US",
                 {
                   month: "long",
                   day: "numeric",
                   year: "numeric",
                 },
               )}`;
             }
             if (value === undefined) {
               return `${key}: Not specified`;
             }
             return `${key}: ${value as string}`;
           })
           .join("\n")}`;
        }
      }

      if (
        input.sharePhrase &&
        trip.is_shared &&
        trip.userId != ctx.session?.user.id
      ) {
        const sharePhrase = await ctx.db.query.trips.findFirst({
          where: and(
            eq(trips.id, input.tripId),
            eq(trips.share_phrase, input.sharePhrase),
          ),
        });
        if (sharePhrase) {
          return tripData;
        }

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid share phrase",
        });
      }

      if (trip.userId !== ctx.session?.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not allowed to access this trip",
        });
      }

      return tripData;
    }),

  updateTripName: protectedProcedure
    .input(z.object({ tripId: z.string().min(1), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(trips)
        .set({ name: input.name })
        .where(eq(trips.id, input.tripId));
    }),

  shareTrip: protectedProcedure
    .input(
      z.object({ tripId: z.string().min(1), sharePhrase: z.string().min(1) }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(trips)
        .set({ share_phrase: input.sharePhrase, is_shared: true })
        .where(and(eq(trips.id, input.tripId), eq(trips.is_shared, false)));
    }),

  getSharePhrase: protectedProcedure
    .input(z.object({ tripId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const trip = await ctx.db.query.trips.findFirst({
        where: and(eq(trips.id, input.tripId)),
      });

      return trip?.share_phrase;
    }),

  unshareTrip: protectedProcedure
    .input(z.object({ tripId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(trips)
        .set({ is_shared: false, share_phrase: null })
        .where(eq(trips.id, input.tripId));
    }),

  deleteTrip: protectedProcedure
    .input(z.object({ tripId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(trips).where(eq(trips.id, input.tripId));
    }),

  getTripMessages: publicProcedure
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

  getItineraries: publicProcedure
    .input(z.object({ tripId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const trip = await ctx.db.query.itineraries.findMany({
        where: eq(itineraries.tripId, input.tripId),
      });

      return trip.map((itinerary) => ({
        csv: itinerary.csv,
        lastUpdated: itinerary.last_updated,
        version: itinerary.version,
      }));
    }),

  updateItineraryCsv: protectedProcedure
    .input(
      z.object({
        tripId: z.string().min(1),
        newCsv: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const itinerary = await ctx.db.query.itineraries.findMany({
        where: eq(itineraries.tripId, input.tripId),
      });

      await ctx.db
        .update(itineraries)
        .set({
          csv: input.newCsv,
          last_updated: sql`CURRENT_TIMESTAMP`,
        })
        .where(
          and(
            eq(itineraries.tripId, input.tripId),
            eq(itineraries.version, itinerary.length),
          ),
        );
    }),
});
