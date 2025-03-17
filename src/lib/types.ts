import { z } from "zod";
import type { Message } from "ai";

export const formSchema = z.object({
  tripName: z.string().min(3, "Trip name needs to be at least 3 characters"),
  startDate: z.date(),
  endDate: z.date(),
  startLocation: z.string().min(1, "Required"),
  destination: z.string().min(1, "Required"),
  numTravelers: z.string(),
  travelStyle: z.string().min(1, "Required"),
  preferredActivities: z.string().optional(),
  specialRequirements: z.string().optional(),
});

export const validUserDataFields = [
  "prompt",
  "startDate",
  "endDate",
  "startLocation",
  "destination",
  "numTravelers",
  "travelStyle",
  "preferredActivities",
  "specialRequirements",
] as const;

export type UserSubmittedData = {
  prompt: string | null;
  startDate: Date | null;
  endDate: Date | null;
  startLocation: string | null;
  destination: string | null;
  numTravelers: string | null;
  travelStyle: string | null;
  preferredActivities: string | null;
  specialRequirements: string | null;
};

export type MessageWithUserInfo = Message & {
  profileImage: string | null;
  name: string | null;
};

export type Itinerary = {
  csv: string;
  lastUpdated: Date;
  version: number;
};

export type TripState =
  | "COLLECTING_DETAILS"
  | "DETAILS_COLLECTED"
  | "CREATING_ITINERARY"
  | "ITINERARY_CREATED";
