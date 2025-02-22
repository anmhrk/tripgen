import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { TRPCError } from "@trpc/server";
import { trips } from "~/server/db/schema";

const validatePromptSchema = z.object({
  prompt: z.string().min(1),
});

export const tripRouter = createTRPCRouter({
  validatePrompt: protectedProcedure
    .input(validatePromptSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { prompt } = input;

        const response = await generateText({
          model: openai("gpt-4o-mini"),
          system: `
          You are a helpful assistant that validates prompts for trip planning.
          If the prompt looks valid to help plan a trip, return ONLY the word "valid",
          otherwise return ONLY the word "invalid".
          `,
          prompt: prompt,
        });

        const tripId = crypto.randomUUID();

        if (response.text === "valid") {
          await ctx.db.insert(trips).values({
            id: tripId,
            userId: ctx.session.user.id,
            prompt: prompt,
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

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),
});
