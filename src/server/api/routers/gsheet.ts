import { z } from "zod";
import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { accounts, trips } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { google } from "googleapis";

export const gsheetRouter = createTRPCRouter({
  createNewGsheet: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.db.query.accounts.findFirst({
        where: eq(accounts.userId, ctx.session.user.id),
      });

      const trip = await ctx.db.query.trips.findFirst({
        where: eq(trips.id, input.tripId),
      });

      if (!account || !trip) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Google account or trip not found",
        });
      }

      const oauth2Client = new google.auth.OAuth2({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
      });

      oauth2Client.setCredentials({
        access_token: account.access_token,
        refresh_token: account.refresh_token,
      });

      const sheets = google.sheets({ version: "v4", auth: oauth2Client });

      const response = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `Tripgen - ${trip?.name}`,
          },
          sheets: [
            {
              properties: {
                title: "Itinerary",
              },
            },
          ],
        },
      });

      const gsheetId = response.data.spreadsheetId;

      if (!gsheetId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create Google Sheet",
        });
      }

      await ctx.db
        .update(trips)
        .set({
          gsheet_id: gsheetId,
        })
        .where(eq(trips.id, input.tripId));

      return {
        gsheetId,
      };
    }),
});
