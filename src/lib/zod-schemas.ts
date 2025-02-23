import { z } from "zod";

export const formSchema = z.object({
  tripName: z.string().min(3, "Trip name needs to be at least 3 characters"),
  startDate: z.date(),
  endDate: z.date(),
  numTravelers: z.string(),
  budgetRange: z.string().min(1, "Required"),
  startLocation: z.string(),
  destination: z.string(),
  travelStyle: z.string().min(1, "Required"),
  accommodation: z.string().min(1, "Required"),
  activities: z.string().optional(),
  specialRequirements: z.string().optional(),
});
