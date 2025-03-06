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
      if (trip.gsheet_id) {
        return {
          gsheetId: trip.gsheet_id,
        };
      }

      const oauth2Client = new google.auth.OAuth2({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
        redirectUri: process.env.AUTH_REDIRECT_URI,
      });

      oauth2Client.setCredentials({
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expiry_date: account.expires_at
          ? new Date(account.expires_at).getTime()
          : undefined,
      });

      // if (account.expires_at) {
      //   const expiryDate = new Date(account.expires_at).getTime();
      //   const currentTime = Date.now();

      //   // If token is expired or about to expire in the next 5 minutes, refresh it
      //   if (expiryDate <= currentTime + 5 * 60 * 1000) {
      //     try {
      //       const { credentials } = await oauth2Client.refreshAccessToken();

      //       if (credentials.access_token) {
      //         // Update the DB with new tokens
      //         await ctx.db
      //           .update(accounts)
      //           .set({
      //             access_token: credentials.access_token,
      //             refresh_token:
      //               credentials.refresh_token ?? account.refresh_token,
      //             expires_at: credentials.expiry_date,
      //           })
      //           .where(eq(accounts.userId, ctx.session.user.id));

      //       }
      //     } catch (error) {
      //       console.error("Token refresh error:", error);
      //       throw new TRPCError({
      //         code: "UNAUTHORIZED",
      //         message:
      //           "Failed to refresh Google authorization. Please reconnect your Google account.",
      //       });
      //     }
      //   }
      // }

      // oauth2Client.on("tokens", (tokens) => {
      //   if (tokens.access_token) {
      //     void ctx.db
      //       .update(accounts)
      //       .set({
      //         access_token: tokens.access_token,
      //         refresh_token: tokens.refresh_token,
      //         expires_at: tokens.expiry_date,
      //       })
      //       .where(eq(accounts.userId, ctx.session.user.id));
      //   }
      // });

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
