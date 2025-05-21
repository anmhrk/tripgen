import { protectedProcedure } from "../lib/orpc";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import OpenAI from "openai";
import { trip } from "../db/schema";
import { ORPCError } from "@orpc/client";
import { eq } from "drizzle-orm";

const client = new OpenAI();

const responseSchema = z.object({
  valid: z.boolean(),
  title: z.string(),
});

export const appRouter = {
  createNewTrip: protectedProcedure
    .input(
      z.object({
        prompt: z.string(),
      })
    )
    .handler(async ({ input, context }) => {
      const { prompt } = input;
      const { session, db } = context;

      const response = await client.responses.parse({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: `You are a helpful assistant that validates prompts and generates a name for trip planning.
        If the prompt looks valid to help plan a trip, return a valid object with the boolean set to true and a title for the trip.
        If the prompt does not look valid, return a valid object with the boolean set to false and an empty string for the title.
        Don't be too strict. Only reject prompts that are pure gibberish, spam, or don't make sense in the context of trip planning.`,
          },
          { role: "user", content: prompt },
        ],
        text: {
          format: zodTextFormat(responseSchema, "response"),
        },
      });

      if (response.error) {
        throw new ORPCError(response.error.message);
      }

      const { valid, title } = response.output_parsed as {
        valid: boolean;
        title: string;
      };

      if (!valid) {
        throw new ORPCError("Only valid trip prompts allowed!");
      }

      const tripId = customAlphabet("1234567890abcdef", 10)();
      await db.insert(trip).values({
        id: tripId,
        title,
        userId: session.user.id,
        createdAt: new Date(),
        status: "created",
      });

      return tripId;
    }),

  getTrip: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ input, context }) => {
      const { tripId } = input;
      const { db } = context;

      const existingTrip = await db.query.trip.findFirst({
        where: eq(trip.id, tripId),
      });

      if (!existingTrip) {
        throw new ORPCError("Trip not found");
      }

      return existingTrip;
    }),
};

export type AppRouter = typeof appRouter;
