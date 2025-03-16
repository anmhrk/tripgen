import { api, HydrateClient } from "~/trpc/server";
import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import { auth } from "~/server/auth";
import { cache } from "react";
import Link from "next/link";

import { LayoutHelper } from "./_components/layout-helper";

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
    const {
      name,
      isShared,
      isOwner,
      firstMessage,
      allDetailsCollected,
      itineraryExists,
    } = await getCachedTrip(id, share);

    return (
      <HydrateClient>
        <LayoutHelper
          session={session}
          isShared={isShared}
          isOwner={isOwner}
          firstMessage={firstMessage}
          name={name}
          allDetailsCollected={allDetailsCollected}
          itineraryExists={itineraryExists}
        />
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
      <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-zinc-300">
        {code.replace("_", " ")}
      </h2>
      <p className="text-muted-foreground">{message}</p>
      <Link
        href="/"
        className="text-md mt-8 rounded-full bg-pink-500 px-6 py-2 font-medium"
      >
        Home
      </Link>
    </div>
  );
}
