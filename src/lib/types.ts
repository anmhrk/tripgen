import { z } from "zod";

export const formSchema = z.object({
  tripName: z.string().min(3, "Trip name needs to be at least 3 characters"),
  startDate: z.date(),
  endDate: z.date(),
  numTravelers: z.string(),
  budgetRange: z.string().min(1, "Required"),
  startLocation: z.string().min(1, "Required"),
  destination: z.string().min(1, "Required"),
  travelStyle: z.string().min(1, "Required"),
  accommodation: z.string().min(1, "Required"),
  activities: z.string().optional(),
  specialRequirements: z.string().optional(),
});

export type UserSubmittedData = {
  prompt: string | null;
  startDate: Date | null;
  endDate: Date | null;
  numTravelers: string | null;
  budgetRange: string | null;
  startLocation: string | null;
  destination: string | null;
  travelStyle: string | null;
  accommodation: string | null;
  activities: string | null;
  specialRequirements: string | null;
};

export const validUserDataFields = [
  "prompt",
  "startDate",
  "endDate",
  "numTravelers",
  "budgetRange",
  "startLocation",
  "destination",
  "travelStyle",
  "accommodation",
  "activities",
  "specialRequirements",
] as const;

export type ValidFieldName = (typeof validUserDataFields)[number];

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type Sheet = "itinerary" | "flights" | "hotels";
export const SHEET_NAMES = ["itinerary", "flights", "hotels"] as const;
