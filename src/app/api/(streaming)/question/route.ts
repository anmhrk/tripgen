import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText, tool } from "ai";
import { auth } from "~/server/auth";
import { trips } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { validUserDataFields, type Message } from "~/lib/types";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = (await request.json()) as {
    messages: Message[];
    tripId: string;
  };

  const messages = data.messages.map((msg: Message) => ({
    role: msg.role,
    content: msg.content,
  }));

  const tripId = data.tripId;

  const trip = await db.query.trips.findFirst({
    where: and(eq(trips.id, tripId), eq(trips.userId, session.user.id)),
  });

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const userData = trip.user_submitted_data;

  if (!userData) {
    return NextResponse.json({ error: "User data not found" }, { status: 404 });
  }

  const updatedMessages = [...messages];

  const response = streamText({
    model: openai("gpt-4o"),
    messages: convertToCoreMessages(messages),
    system: `You are a helpful travel planning assistant. Your job is to gather information about the user's trip.
          First, check what information is missing using the checkMissingFields tool.
          Then, ask ONLY ONE question at a time using the askQuestion tool.
          After receiving a response to the question, update the database using updateTripData tool.
          Then check again for missing fields and continue until all required information is collected.
          Be conversational and friendly. Acknowledge the user's responses.
          User's initial trip prompt: "${userData?.prompt}"

          IMPORTANT: Please only ask ONE question at a time.
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

      checkMissingFields: tool({
        description: "Check which fields are still missing from the trip data",
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

          return {
            missingFields,
            isComplete: missingFields.length === 0,
            currentData: userData,
          };
        },
      }),
    },
    onFinish: async (completion) => {
      updatedMessages.push({
        role: "assistant",
        content: completion.text,
      });

      await db
        .update(trips)
        .set({ messages: updatedMessages })
        .where(eq(trips.id, tripId));
    },
    maxSteps: 5,
  });

  return response.toDataStreamResponse();
}

// TODO:
// db flag that details have been collected