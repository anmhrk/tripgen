import { type NextRequest, NextResponse } from "next/server";
import { convertToCoreMessages, streamText, tool, type Message } from "ai";
import { openai } from "@ai-sdk/openai";
import { sheets, trips } from "~/server/db/schema";
import { db } from "~/server/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { tavily } from "@tavily/core";
import { env } from "~/env";
import { validUserDataFields } from "~/lib/types";

// export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { messages, tripId } = (await req.json()) as {
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

  if (!userData) {
    return NextResponse.json({ error: "User data not found" }, { status: 404 });
  }

  // const sheetData = await db.query.sheets.findMany({
  //   where: eq(sheets.tripId, tripId),
  // });

  // const sheetContent = sheetData
  //   .map((sheet) => `Sheet Name: ${sheet.name}\n${sheet.content}`)
  //   .join("\n\n");

  const sheetData = await db.query.sheets.findFirst({
    where: and(eq(sheets.tripId, tripId), eq(sheets.name, "itinerary")),
  });

  const sheetContent = sheetData?.content ?? "";

  const useGeneralChat = trip.all_details_collected;

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

  const generalChatPrompt = `\n
    You are an expert travel planning assistant with deep knowledge of destinations worldwide. 
    Your goal is to create, update, and maintain detailed, personalized trip itineraries.

    <main_instructions>
    First, in the context given to you, check if there is an existing itinerary for this trip.
      - If there is no itinerary, use the generateOrUpdateItinerary tool to create a new itinerary
      - A web search tool is also available to you. This will allow you to get up-to-date and accurate information
        that you can use when creating this itinerary. Use this tool first and gather information. Then create the itinerary.
      - Once you have created the itinerary and it's saved in the database, summarize what you just created in a nice and
        simple paragraph. At the end ask the user if they think the itinerary looks good and say that they can ask you to modify
        it however they'd like.

    ***Below instructions are only if there is an itinerary in context. Please use the above instructions if current itinerary is empty***

    1. First analyze the user request. It can be of four types:
      a) They want information about their current itinerary
      b) They want you to modify something in the existing itinerary
      c) They have questions about destinations, activities, or travel logistics
      d) Need recommendations about something regarding their trip

    There could be other kinds of requests too. These ones will be the most common. Cater to each one appropriately. Here is how you could do that:

      a) Simply refer to the itinerary in the context below and answer their question
      b) - Refer to the itinerary in the context below
         - Use the web search tool if needed (will allow you to get up-to-date and accurate information)
         - Then use the generateOrUpdateItinerary tool to update the itinerary in the db with your changes
         - Once changes are saved in the db, say to the user that the changes are now applied to the db
      c) Use the web search tool if needed or use your training data
      d) Again, use the web search tool if needed or your training data
    </main_instructions>

    <itinerary_rules>
    - When you create or update an itinerary, they MUST start with these exact headers:
      Date,Day,Time,Location,Activity,Notes
      ...content...
    - NEVER use markdown or other formatting. Just pure CSV and nothing else
    - Break each day into Morning (8-12), Afternoon (12-6), Evening (6-10) segments
    - Include 1-2 (max 3) activities per time segment
    - Factor in realistic travel times between locations
    - Include other suggestions for food or shopping when applicable
    - Make the itinerary as detailed as possible
    - Honor the user's preferences (specially the budget range, travel style, special requirements) that are also given to you in context below
    - Make sure to include the specific activities that the user has mentioned in context below
    </itinerary_rules>

    <context>
    Trip Name: ${trip.name}

    User Preferences/Data:
    ${JSON.stringify(userData)}
    
    Current Itinerary:
    ${sheetContent}
    </context>

    <stuff_to_remember>
    - Today's date is: ${new Date().toLocaleDateString()}
    - Be concise but warm and friendly
    - Show genuine enthusiasm so that the user feels good about chatting with you
    - If the user's query seems off, say that you didn't quite get that
    - Never use markdown in your response. Just plain text.
    </stuff_to_remember>
  `;

  const generalChatTools = {
    webSearch: tool({
      description:
        "A tool for searching the web with access to multiple queries for validating and getting up to date information",
      parameters: z.object({
        query: z
          .array(z.string())
          .describe("Array of search queries to look up on the web."),
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
    // For now only working with the itinerary sheet
    generateOrUpdateItinerary: tool({
      description:
        "A tool to generate a new itinerary or update an existing one",
      parameters: z.object({
        content: z.string().describe("CSV content for the itinerary"),
      }),
      execute: async ({ content }) => {
        await db
          .update(sheets)
          .set({ content, last_updated: new Date() })
          .where(and(eq(sheets.tripId, tripId), eq(sheets.name, "itinerary")));

        return {
          success: true,
          message: "Itinerary generated orupdated successfully",
        };
      },
    }),
  };

  const response = streamText({
    model: openai("gpt-4o"),
    messages: convertToCoreMessages(messages),
    system: useGeneralChat ? generalChatPrompt : gatherTripDataPrompt,
    tools: useGeneralChat ? generalChatTools : gatherTripDataTools,
    onFinish: async (completion) => {
      const userMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: messages[messages.length - 1]?.content ?? "",
      } as Message;

      const assistantMessage = {
        id: completion.response.id,
        role: "assistant",
        content: completion.text,
      } as Message;

      const newMessages = [userMessage, assistantMessage];
      const updatedMessages = [...(trip.messages ?? []), ...newMessages];

      await db
        .update(trips)
        .set({ messages: updatedMessages })
        .where(eq(trips.id, tripId));
    },
    maxSteps: 5,
    toolCallStreaming: true,
  });

  return response.toDataStreamResponse();
}
