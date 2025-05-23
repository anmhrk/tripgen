import { ConvexError, v } from "convex/values";
import { action, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { z } from "zod";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod.mjs";
import { getAuthUserId } from "@convex-dev/auth/server";
import { customAlphabet } from "nanoid";

const responseSchema = z.object({
  valid: z.boolean(),
  title: z.string(),
});

export const createTrip = action({
  args: { prompt: v.string() },
  handler: async (ctx, args) => {
    const { prompt } = args;

    const client = new OpenAI();
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
      throw new ConvexError(response.error.message);
    }

    const { valid, title } = response.output_parsed as {
      valid: boolean;
      title: string;
    };

    if (!valid) {
      throw new ConvexError("Only valid trip prompts allowed!");
    }

    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("User not found!");
    }

    const routeId = customAlphabet("1234567890abcdef", 10)();
    await ctx.runMutation(internal.functions.trip.writeTripToDb, {
      routeId,
      userId,
      title,
      prompt,
    });

    return routeId;
  },
});

export const writeTripToDb = internalMutation({
  args: {
    routeId: v.string(),
    userId: v.id("users"),
    title: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const { routeId, userId, title, prompt } = args;
    await ctx.db.insert("trips", {
      routeId,
      userId,
      title,
      prompt,
      status: "created",
      createdAt: Date.now(),
    });
  },
});
