"use client";
import { api } from "~/trpc/react";
import Link from "next/link";
import { formatDistance } from "date-fns";
import { Skeleton } from "~/components/ui/skeleton";

export function Recents() {
  const recentTrips = api.trips.getRecentTrips.useQuery();

  return (
    <div className="mt-8 flex flex-col gap-4">
      {recentTrips.isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      )}

      {/* Pagination? */}
      {recentTrips.data?.length !== 0 && !recentTrips.isLoading && (
        <>
          <h2 className="text-xl font-semibold">Your Recent Trips</h2>
          <div className="flex flex-col gap-2">
            {recentTrips.data?.map((trip) => (
              <Link
                key={trip.id}
                href={`/trip/${trip.id}`}
                className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <div className="font-medium">{trip.name}</div>
                {trip.createdAt && (
                  <div className="text-sm text-gray-500">
                    Created{" "}
                    {formatDistance(new Date(trip.createdAt), new Date(), {
                      addSuffix: true,
                    })}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
