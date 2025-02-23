import { api } from "~/trpc/server";
import { HydrateClient } from "~/trpc/server";
import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";

async function getTripData(id: string) {
  try {
    return await api.trips.returnTripData({
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
    const tripData = await getTripData(id);
    return {
      title: `${tripData.name} | TripGen`,
    };
  } catch (error) {
    return {
      title: error instanceof TRPCError ? error.code : "TripGen",
    };
  }
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const tripData = await getTripData(id);

    return (
      <HydrateClient>
        <div>Hello, trip id is: {id}</div>
        <div>{tripData.name}</div>
      </HydrateClient>
    );
  } catch (error) {
    if (error instanceof TRPCError) {
      if (error.code === "NOT_FOUND") {
        return (
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              {error.code}
            </h2>
            <p className="text-gray-600">{error.message}</p>
          </div>
        );
      } else if (error.code === "FORBIDDEN") {
        return (
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              {error.code}
            </h2>
            <p className="text-gray-600">{error.message}</p>
          </div>
        );
      }
    }
  }
}
