import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { trips } from "~/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { streamText, convertToCoreMessages, type Message, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { tavily } from "@tavily/core";
import { validUserDataFields } from "~/lib/types";

export const aiRouter = createTRPCRouter({
  aiChat: protectedProcedure
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
        sheetContent: z.string(),
      }),
    )
    .mutation(async function* ({ ctx, input }) {
      const { messages, tripId, sheetContent } = input;

      const trip = await ctx.db.query.trips.findFirst({
        where: and(eq(trips.id, tripId), eq(trips.userId, ctx.session.user.id)),
      });

      if (!trip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      const userData = trip.user_submitted_data;

      if (!userData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User data not found",
        });
      }

      // gatherTripData first if trip created from prompt, or else use generalChat

      const gatherTripDataPrompt = `\n
        You are a thoughtful travel planning assistant focused on gathering information to 
        create personalized trip plans.

        <main_instructions>
        1. Begin by using the checkMissingFields tool to identify what information is needed.
        2. Ask ONE question at a time using the askQuestion tool.
        3a. After each user response, acknowledge their input in a friendly, conversational tone.
        3b. Use the updateTripData tool to record their answers into the database immediately.
        4. Verify updated information before proceeding to your next question.

        - When asking travel dates, make sure to ask for the start and end dates together. 
          Then update both dates in the database together using the updateTripData tool.
        - If user says no to a question, for example, they don't want to specify a budget or 
          they don't have any special requirements, then update the database with "not specified" 
          for that particular field.

        - Once all fields are complete (meaning the checkMissingFields tool returns an empty array for missingFields),
          use the allFieldsComplete tool to set all_details_collected to true in the database.
          Then say EXACTLY this: "All right, thanks for providing all the information. Let's get started building your perfect itinerary!"
        </main_instructions>

        <things_to_keep_in_mind>
        - Your first message should introduce yourself and say that you will need to ask a few questions 
          to help create a personalized itinerary
        - Be concise but warm and friendly
        - Show enthusiasm for the user's destination choices
        - Avoid overwhelming the user with too many options at once
        - If information is unclear, politely ask for clarification on that specific point only
        - Today's date is: ${new Date().toLocaleDateString()}
        </things_to_keep_in_mind>
      `;

      const gatherTripDataTools = {
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
            field: z.enum(validUserDataFields).describe("The field to update"),
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
      };

      const generalChatPrompt = `\n
        You are an expert travel planning assistant with deep knowledge of destinations worldwide. 
        Your goal is to create highly detailed, personalized travel experiences while ensuring practical logistics.

        <main_instructions>
          1. Core Responsibilities:
            - Provide detailed, actionable travel plans with structured itineraries.
            - Use the webSearch tool to validate all information before suggesting activities.
            - Factor in local events, seasonal closures, and real-time travel conditions.
            - Maintain and enhance the itinerary in CSV format.

          2. Itinerary Structure:
            - Format: CSV with "Date, Day, Time, Location, Activity, Notes" headers
            - Each day should have:
              - Morning, Afternoon, and Evening sections.
              - Maximum two activities per time slot (unless user specifies otherwise).
              - Detailed transportation options (e.g., "Take Metro Line 1 from X to Y"). Use webSearch tool for this.
              - Estimated cost breakdown for major expenses.

          REFRAIN FROM USING MARKDOWN IN THE ITINERARY. ALWAYS USE CSV FORMAT.

          3. Personalization Guidelines Given By User:
            - Travel Style: ${userData.travelStyle} - Adjust activities accordingly.
            - Budget: ${userData.budgetRange} - Respect this budget.
            - Group Size: ${userData.numTravelers} - Consider group logistics.
            - Special Requirements: ${userData.specialRequirements} - Prioritize these needs.
        </main_instructions>

        <current_trip_context>
          Trip Name: ${trip.name}
          Trip Details Provided By User: 
          ${JSON.stringify(userData)}

          Current Itinerary in parsed CSV Format:
          ${sheetContent}
        </current_trip_context>

        <response_guidelines>
          1. Always use webSearch before suggesting activities, transport, or venues. Or if the user asks for recommendations.
            - Queries should cover top attractions, hidden gems, dining, transport, and events.

          2. Detailed Planning Approach:
            - Group activities by proximity to minimize unnecessary travel.
            - Alternate between high-energy & relaxed experiences to maintain balance.
            - Suggest dining options relevant to the itinerary.
            - Provide transportation details (mode, time, cost, and duration).

          4. Key Considerations:
            - Always check opening hours, ticket availability, and travel restrictions.
            - Provide alternative options in case of closures.
            - Today's date: ${new Date().toLocaleDateString()}.

          If no itinerary exists, create a fully structured plan that:
            - Starts with an arrival & adjustment day.
            - Balances activity levels to prevent exhaustion.
            - Includes local dining recommendations every day.
            - Factors in realistic travel times.
            - Adapts to the user’s preferences & budget.
        </response_guidelines>
      `;

      const generalChatTools = {
        webSearch: tool({
          description: "Search the web with multiple queries and search depth",
          parameters: z.object({
            queries: z.array(
              z
                .string()
                .describe("Array of search queries to look up on the web."),
            ),
          }),
          execute: async ({ queries }) => {
            const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

            const searchResults = await Promise.all(
              queries.map((query) =>
                tvly.search(query, {
                  max_results: 5,
                  search_depth: "advanced",
                }),
              ),
            );

            return { searchResults };
          },
        }),
      };

      const useGeneralChat = trip.all_details_collected;

      const response = streamText({
        model: openai("gpt-4o"),
        messages: convertToCoreMessages(messages),
        system: useGeneralChat ? generalChatPrompt : gatherTripDataPrompt,
        tools: useGeneralChat ? generalChatTools : gatherTripDataTools,
        onFinish: async (completion) => {
          // Append the assistant response to messages and save to db
          messages.push({
            id: completion.response.id,
            role: "assistant",
            content: completion.text,
          });

          await ctx.db
            .update(trips)
            .set({ messages })
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
