import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { TRPCError } from "@trpc/server";
import { trips } from "~/server/db/schema";
import { formSchema } from "~/lib/zod-schemas";

export const tripRouter = createTRPCRouter({
  createTripFromPrompt: protectedProcedure
    .input(z.object({ prompt: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
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

        const tripId = crypto.randomUUID();

        if (response.object.valid && response.object.name) {
          await ctx.db.insert(trips).values({
            id: tripId,
            userId: ctx.session.user.id,
            name: response.object.name,
            user_submitted: {
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

          return {
            tripId: tripId,
          };
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Please provide a valid trip planning prompt",
          });
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),

  createTripFromForm: protectedProcedure
    .input(formSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const tripId = crypto.randomUUID();

        await ctx.db.insert(trips).values({
          id: tripId,
          userId: ctx.session.user.id,
          name: input.tripName,
          user_submitted: {
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

        return {
          tripId: tripId,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),
});
