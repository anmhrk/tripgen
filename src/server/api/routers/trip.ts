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
import { eq, and, sql, gt, inArray, desc } from "drizzle-orm";

export const tripRouter = createTRPCRouter({
  // Mutations
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
        Don't be too strict. Only reject prompts that are pure gibberish, spam, or don't make sense in the context of trip planning.
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
          startLocation: null,
          destination: null,
          travelStyle: null,
          preferredActivities: null,
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
          startLocation: input.startLocation,
          destination: input.destination,
          travelStyle: input.travelStyle,
          preferredActivities: input.preferredActivities ?? null,
          specialRequirements: input.specialRequirements ?? null,
        },
        all_details_collected: true,
      });

      return { tripId };
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
      const itinerary = await ctx.db.query.itineraries.findMany({
        where: eq(itineraries.tripId, input.tripId),
      });

      await ctx.db.delete(itineraries).where(
        inArray(
          itineraries.id,
          itinerary.map((itinerary) => itinerary.id),
        ),
      );

      await ctx.db.delete(trips).where(eq(trips.id, input.tripId));
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

  restoreItineraryVersion: protectedProcedure
    .input(z.object({ tripId: z.string().min(1), version: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const toDelete = await ctx.db.query.itineraries.findMany({
        where: and(
          eq(itineraries.tripId, input.tripId),
          gt(itineraries.version, input.version),
        ),
      });

      await ctx.db.delete(itineraries).where(
        inArray(
          itineraries.id,
          toDelete.map((itinerary) => itinerary.id),
        ),
      );
    }),

  // Queries
  validateTrip: publicProcedure
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

      const itineraryResults = await ctx.db.query.itineraries.findMany({
        where: eq(itineraries.tripId, input.tripId),
      });

      const tripData = {
        isShared: trip.is_shared,
        isOwner: trip.userId === ctx.session?.user.id,
        name: trip.name,
        firstMessage: "",
        allDetailsCollected: trip.all_details_collected,
        itineraryExists: itineraryResults.length > 0,
      };

      if (trip.messages.length === 0) {
        if (trip.user_submitted_data?.prompt) {
          tripData.firstMessage = trip.user_submitted_data.prompt;
        } else {
          tripData.firstMessage = `Please make me an itinerary for my trip. Here are the details:\n\n
          ${JSON.stringify(trip.user_submitted_data, null, 2)}`;
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

  getRecentTrips: protectedProcedure.query(async ({ ctx }) => {
    const recentTrips = await ctx.db.query.trips.findMany({
      where: eq(trips.userId, ctx.session.user.id),
      orderBy: desc(trips.createdAt),
    });

    return recentTrips.map((trip) => ({
      id: trip.id,
      name: trip.name,
      createdAt: trip.createdAt,
    }));
  }),

  getSharePhrase: protectedProcedure
    .input(z.object({ tripId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const trip = await ctx.db.query.trips.findFirst({
        where: and(eq(trips.id, input.tripId)),
      });

      return trip?.share_phrase;
    }),

  getTripData: publicProcedure
    .input(z.object({ tripId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const trip = await ctx.db.query.trips.findFirst({
        where: eq(trips.id, input.tripId),
      });

      const itineraryResults = await ctx.db.query.itineraries.findMany({
        where: eq(itineraries.tripId, input.tripId),
      });

      return {
        messages: trip!.messages,
        itineraries: itineraryResults.map((itinerary) => ({
          csv: itinerary.csv,
          lastUpdated: itinerary.last_updated,
          version: itinerary.version,
        })),
      };
    }),
});
