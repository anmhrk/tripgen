import { api } from "~/trpc/server";
import { HydrateClient } from "~/trpc/server";
import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import { auth } from "~/server/auth";
import { cache } from "react";

import { TopNav } from "./_components/top-nav";
import { Chat } from "./_components/chat";
import { GSheet } from "./_components/gsheet";

const getCachedTrip = cache(async (id: string, share?: string) => {
  try {
    return await api.trips.getTripDataOnLoad({
      tripId: id,
      sharePhrase: share,
    });
  } catch (error) {
    throw error;
  }
});

export default async function TripPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ share: string }>;
}) {
  const { id } = await params;
  const { share } = await searchParams;
  const session = await auth();

  try {
    const { name, isShared, gsheetId } = await getCachedTrip(id, share);

    return (
      <HydrateClient>
        <div className="flex h-screen flex-col">
          <TopNav tripName={name} isShared={isShared} session={session} />
          <div className="flex flex-1 gap-2 p-2">
            <Chat />
            <GSheet gsheetId={gsheetId} />
          </div>
        </div>
      </HydrateClient>
    );
  } catch (error) {
    if (error instanceof TRPCError) {
      return <ErrorMessage code={error.code} message={error.message} />;
    }
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ share: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { share } = await searchParams;

  try {
    const { name } = await getCachedTrip(id, share);
    return {
      title: `${name} | TripGen`,
    };
  } catch (error) {
    return {
      title:
        error instanceof TRPCError ? error.code.replace("_", " ") : "TripGen",
    };
  }
}

function ErrorMessage({ code, message }: { code: string; message: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h2 className="mb-2 text-2xl font-bold text-gray-900">
        {code.replace("_", " ")}
      </h2>
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
