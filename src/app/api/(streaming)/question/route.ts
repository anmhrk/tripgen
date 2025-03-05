import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText, tool } from "ai";
import { auth } from "~/server/auth";
import { trips } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, tripId } = (await request.json()) as {
    messages: Message[];
    tripId: string;
  };

  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
  });

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const userData = trip.user_submitted_data;

  const response = streamText({
    model: openai("gpt-4o"),
    messages: convertToCoreMessages(messages),
    system: `You are a helpful travel planning assistant. Your job is to gather information about the user's trip.
          First, check what information is missing using the checkMissingFields tool.
          Then, ask ONE question at a time using the askQuestion tool.
          After receiving a response, update the trip data using updateTripData tool.
          Then check again for missing fields and continue until all required information is collected.
          Be conversational and friendly. Acknowledge the user's responses.
          User's initial trip prompt: "${userData?.prompt}`,
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
          // This just returns the question - the actual response will come from the user
          return { field, question, options };
        },
      }),

      updateTripData: tool({
        description: "Update the trip data with user's response",
        parameters: z.object({
          field: z.string().describe("The field to update"),
          value: z.any().describe("The value to set for this field"),
        }),
        execute: async ({ field, value }) => {
          // Update the userData object
          if (userData) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
            (userData as unknown as Record<string, any>)[field] = value;
          }

          // Save to database
          await db
            .update(trips)
            .set({ user_submitted_data: userData })
            .where(eq(trips.id, tripId));

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          return { success: true, field, value };
        },
      }),

      checkMissingFields: tool({
        description: "Check which fields are still missing from the trip data",
        parameters: z.object({}),
        execute: async () => {
          const missingFields = [];

          if (!userData?.startDate || !userData.endDate)
            missingFields.push("travel dates");
          if (!userData?.numTravelers)
            missingFields.push("number of travelers");
          if (!userData?.budgetRange) missingFields.push("budget range");
          if (!userData?.startLocation) missingFields.push("starting location");
          if (!userData?.destination) missingFields.push("destination");
          if (!userData?.travelStyle)
            missingFields.push("travel style preferences");
          if (!userData?.accommodation)
            missingFields.push("accommodation preferences");

          return {
            missingFields,
            isComplete: missingFields.length === 0,
            currentData: userData,
          };
        },
      }),
    },
    maxSteps: 5,
  });

  return response.toDataStreamResponse();
}

export const runtime = "edge";
export const maxDuration = 30;
