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
        system: `\n
        You are a thoughtful travel planning assistant focused on creating personalized trip plans.

        <main_instructions>
        1. Begin by using the checkMissingFields tool to identify what information is needed.
        2. Ask ONE question at a time using the askQuestion tool.
        3a. After each user response, acknowledge their input in a friendly, conversational tone.
        3b. Use the updateTripData tool to record their answers into the database immediately.
        4. Verify updated information before proceeding to your next question.

        - When asking travel dates, make sure to ask for the start and end dates together. 
          Then update both dates in the database together using the updateTripData tool.
        - If user says no to a question, for example, they don't want to specify a budget or they don't have any special requirements,
          then update the database with "not specified" for that particular field.

        - Once all fields are complete (meaning the checkMissingFields tool returns an empty array for missingFields),
          use the allFieldsComplete tool to set all_details_collected to true in the database.
          Then say EXACTLY this: "All right, thanks for providing all the information. Let's get started building your perfect itinerary!"
        </main_instructions>

        <things_to_keep_in_mind>
        - Your first message should introduce yourself and say that you will need to ask a few questions to help create a personalized itinerary.
        - Be concise but warm and friendly
        - Show enthusiasm for the user's destination choices
        - Avoid overwhelming the user with too many options at once
        - If information is unclear, politely ask for clarification on that specific point only
        - Today's date is: ${new Date().toLocaleDateString()}
        </things_to_keep_in_mind>
        `,
        tools: {
          checkMissingFields: tool({
            description: "Check which fields are missing from the trip data",
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
              if (!userData.activities) missingFields.push("activities");
              if (!userData.specialRequirements)
                missingFields.push("specialRequirements");

              const isComplete = missingFields.length === 0;
              return {
                missingFields,
                isComplete,
                currentData: userData,
              };
            },
          }),
          askQuestion: tool({
            description: "Ask the user a question about their trip",
            parameters: z.object({
              field: z.string().describe("The field we're asking about"),
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
          // Save user's response to database
          updateTripData: tool({
            description:
              "Update the trip data in the database with user's response",
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
          allFieldsComplete: tool({
            description:
              "Update the all_details_collected flag in the database if missing fields are now complete",
            parameters: z.object({}),
            execute: async () => {
              await ctx.db
                .update(trips)
                .set({ all_details_collected: true })
                .where(eq(trips.id, tripId));

              return { success: true };
            },
          }),
        },
        onFinish: async (completion) => {
          // Append the assistant response to all messages
          allMessages.push({
            id: completion.response.id,
            role: "assistant",
            content: completion.text,
          });

          // Unique filter
          const uniqueMessages = allMessages.filter(
            (message, idx, self) =>
              idx ===
              self.findIndex(
                (t) => t.id === message.id || t.content === message.content,
              ),
          );

          await ctx.db
            .update(trips)
            .set({ messages: uniqueMessages })
            .where(eq(trips.id, tripId));
        },
        maxSteps: 5,
      });

      // Stream chunks back
      for await (const chunk of response.textStream) {
        yield { content: chunk };
      }
    }),
});
