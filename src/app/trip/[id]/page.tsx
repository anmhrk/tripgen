import { api } from "~/trpc/server";
import { HydrateClient } from "~/trpc/server";
import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import { auth } from "~/server/auth";

import { TopNav } from "./_components/top-nav";
import { Chat } from "./_components/chat";
import { GSheet } from "./_components/gsheet";

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  try {
    const tripName = await getTripName(id);

    return (
      <HydrateClient>
        <div className="flex h-screen flex-col">
          <TopNav tripName={tripName} session={session!} />
          <div className="flex flex-1 gap-1 p-2">
            <Chat />
            <GSheet />
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

async function getTripName(id: string) {
  try {
    return await api.trips.getTripName({
      tripId: id,
    });
  } catch (error) {
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const tripName = await getTripName(id);
    return {
      title: `${tripName} | TripGen`,
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
