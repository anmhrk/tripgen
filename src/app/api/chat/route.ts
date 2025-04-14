import { type NextRequest, NextResponse } from "next/server";
import {
  convertToCoreMessages,
  createDataStreamResponse,
  streamText,
  tool,
  smoothStream,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { itineraries, trips } from "~/server/db/schema";
import { db } from "~/server/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { tavily } from "@tavily/core";
import { env } from "~/env";
import { validUserDataFields } from "~/lib/types";
import { gatherTripDataPrompt, generalChatPrompt } from "~/lib/prompts";
import { auth } from "~/server/auth";
import type { MessageWithUserInfo } from "~/lib/types";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, tripId, webSearchEnabled } = (await req.json()) as {
    messages: MessageWithUserInfo[];
    tripId: string;
    webSearchEnabled: boolean;
  };

  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
  });

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const userData = trip.user_submitted_data;

  if (!userData) {
    return NextResponse.json({ error: "User data not found" }, { status: 404 });
  }

  const useGeneralChat = trip.all_details_collected;

  const itineraryResults = await db.query.itineraries.findMany({
    where: eq(itineraries.tripId, tripId),
  });

  const latestItineraryVersion = itineraryResults.length;

  const latestItineraryCsv = itineraryResults.find(
    (itinerary) => itinerary.version === latestItineraryVersion,
  )?.csv;

  const gatherTripDataTools = {
    checkMissingFields: tool({
      description: "Check which fields are missing from the trip data",
      parameters: z.object({}),
      execute: async () => {
        const missingFields = [];

        if (!userData.startDate) missingFields.push("startDate");
        if (!userData.endDate) missingFields.push("endDate");
        if (!userData.startLocation) missingFields.push("startLocation");
        if (!userData.destination) missingFields.push("destination");
        if (!userData.travelStyle) missingFields.push("travelStyle");
        if (!userData.numTravelers) missingFields.push("numTravelers");
        if (!userData.preferredActivities)
          missingFields.push("preferredActivities");
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
    updateTripData: tool({
      description: "Update the trip data in the database with user's response",
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

        await db
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
        await db
          .update(trips)
          .set({ all_details_collected: true })
          .where(eq(trips.id, tripId));

        return { success: true };
      },
    }),
  };

  return createDataStreamResponse({
    execute: async (dataStream) => {
      const generalChatTools = {
        webSearch: tool({
          description:
            "A tool for searching the web with access to multiple queries for validating and getting up to date information",
          parameters: z.object({
            query: z
              .array(z.string())
              .max(5)
              .describe(
                "Array of search queries to look up on the web. Max 5 at a time.",
              ),
          }),
          execute: async ({ query }) => {
            const tvly = tavily({ apiKey: env.TAVILY_API_KEY });

            const searchResults = await Promise.all(
              query.map((query) =>
                tvly.search(query, {
                  max_results: 5,
                }),
              ),
            );

            return { searchResults };
          },
        }),
        generateOrUpdateItinerary: tool({
          description:
            "A tool to generate a new itinerary or update an existing one",
          parameters: z.object({
            content: z.string().describe("CSV content for the itinerary sheet"),
          }),
          execute: async ({ content }) => {
            await db.insert(itineraries).values({
              csv: content,
              last_updated: new Date(),
              tripId: tripId,
              version: latestItineraryVersion + 1,
            });

            dataStream.writeData({
              type: "csv",
              content,
              version: latestItineraryVersion + 1,
            });

            return {
              success: true,
              message: `Itinerary generated or updated successfully`,
            };
          },
        }),
      };

      const result = streamText({
        model: openai("gpt-4.1"),
        messages: convertToCoreMessages(messages),
        system: useGeneralChat
          ? generalChatPrompt(
              trip.name,
              userData,
              latestItineraryCsv ?? "",
              webSearchEnabled,
            )
          : gatherTripDataPrompt,
        tools: useGeneralChat ? generalChatTools : gatherTripDataTools,
        onFinish: async (completion) => {
          const userMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: messages[messages.length - 1]?.content ?? "",
            profileImage: session.user.image,
            name: session.user.name,
          } as MessageWithUserInfo;

          const assistantMessage = {
            id: completion.response.id,
            role: "assistant",
            content: completion.text,
          } as MessageWithUserInfo;

          const newMessages = [userMessage, assistantMessage];
          const updatedMessages = [...(trip.messages ?? []), ...newMessages];

          await db
            .update(trips)
            .set({ messages: updatedMessages })
            .where(eq(trips.id, tripId));
        },
        maxSteps: 5,
        toolCallStreaming: true,
        experimental_transform: smoothStream({
          delayInMs: 20,
        }),
      });

      result.mergeIntoDataStream(dataStream);
    },
  });
}
