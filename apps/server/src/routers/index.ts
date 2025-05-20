import { protectedProcedure } from "../lib/orpc";
import { z } from "zod";

export const appRouter = {
  createNewTrip: protectedProcedure
    .input(
      z.object({
        prompt: z.string(),
      })
    )
    .handler(async ({ input, context }) => {
      const { prompt } = input;
      const { session } = context;
    }),
};
export type AppRouter = typeof appRouter;
