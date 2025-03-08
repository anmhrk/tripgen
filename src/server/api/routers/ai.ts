import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { trips } from "~/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { streamText, convertToCoreMessages, type Message, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { validUserDataFields } from "~/lib/types";

export const aiRouter = createTRPCRouter({
  gatherTripData: protectedProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            id: z.string(),
            role: z.string(),
            content: z.string(),
          }),
        ) as z.ZodType<Message[]>,
        tripId: z.string(),
      }),
    )
    .mutation(async function* ({ ctx, input }) {
      const { messages, tripId } = input;

      const trip = await ctx.db.query.trips.findFirst({
        where: and(eq(trips.id, tripId), eq(trips.userId, ctx.session.user.id)),
      });

      if (!trip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      const existingMessages = trip.messages || [];
      const allMessages = [...existingMessages, ...messages];

      const userData = trip.user_submitted_data;

      if (!userData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User data not found",
        });
      }

      const response = streamText({
        model: openai("gpt-4o"),
        messages: convertToCoreMessages(allMessages),
        system: `You are a thoughtful travel planning assistant focused on creating personalized trip plans.

        When interacting with users:
        1. Begin by using the checkMissingFields tool to identify what information is needed.
        2. Ask exactly ONE question at a time using the askQuestion tool.
        3. After each user response, acknowledge their input in a friendly, conversational tone before moving to the next step.
        4. Use the updateTripData tool to record their answers immediately.
        5. Verify updated information before proceeding to your next question.

        When all required information is collected:
        - Summarize the trip details you've gathered
        - Offer relevant suggestions based on their preferences
        - Ask if they'd like any aspect of their trip plan refined

        Today's date is: ${new Date().toLocaleDateString()}

        Style guide:
        - Be concise but warm
        - Show enthusiasm for the user's destination choices
        - Avoid overwhelming the user with too many options at once
        - If information is unclear, politely ask for clarification on that specific point only
        `,
        tools: {
          askQuestion: tool({
            description: "Ask the user a question about their trip",
            parameters: z.object({
              field: z
                .string()
                .describe(
                  "The field we're asking about (e.g., 'startDate', 'numTravelers')",
                ),
              question: z.string().describe("The question to ask the user"),
              options: z
                .array(z.string())
                .optional()
                .describe("Optional list of suggested answers"),
            }),
            execute: async ({ field, question, options }) => {
              return { field, question, options };
            },
          }),

          // Save to database
          updateTripData: tool({
            description: "Update the trip data with user's response",
            parameters: z.object({
              field: z
                .enum(validUserDataFields)
                .describe("The field to update"),
              value: z
                .union([z.string(), z.date()])
                .describe("The value to set for this field"),
            }),
            execute: async ({ field, value }) => {
              if (field === "startDate" || field === "endDate") {
                const dateValue = new Date(value);
                userData[field] = dateValue;
              } else {
                userData[field] = value as string;
              }

              await ctx.db
                .update(trips)
                .set({ user_submitted_data: userData })
                .where(eq(trips.id, tripId));

              return { success: true, field, value };
            },
          }),

          checkMissingFields: tool({
            description:
              "Check which fields are still missing from the trip data",
            parameters: z.object({}),
            execute: async () => {
              const missingFields = [];

              if (!userData.startDate) missingFields.push("startDate");
              if (!userData.endDate) missingFields.push("endDate");
              if (!userData.numTravelers) missingFields.push("numTravelers");
              if (!userData.budgetRange) missingFields.push("budgetRange");
              if (!userData.startLocation) missingFields.push("startLocation");
              if (!userData.destination) missingFields.push("destination");
              if (!userData.travelStyle) missingFields.push("travelStyle");
              if (!userData.accommodation) missingFields.push("accommodation");

              const isComplete = missingFields.length === 0;

              // If all fields are complete, update the trip with a flag
              if (isComplete && !trip.all_details_collected) {
                await ctx.db
                  .update(trips)
                  .set({ all_details_collected: true })
                  .where(eq(trips.id, tripId));
              }

              return {
                missingFields,
                isComplete,
                currentData: userData,
              };
            },
          }),
        },
        onFinish: async (completion) => {
          // Add the new response to all messages
          allMessages.push({
            id: completion.response.id,
            role: "assistant",
            content: completion.text,
          });

          // Update with the complete message history
          await ctx.db
            .update(trips)
            .set({ messages: allMessages })
            .where(eq(trips.id, tripId));
        },
        maxSteps: 5,
      });

      for await (const chunk of response.textStream) {
        yield { content: chunk };
      }
    }),
});
