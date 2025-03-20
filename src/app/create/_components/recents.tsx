"use client";
import { api } from "~/trpc/react";
import Link from "next/link";
import { formatDistance } from "date-fns";
import { useEffect, useState } from "react";
import type { RecentTrip } from "~/lib/types";
import { Skeleton } from "~/components/ui/skeleton";

export function Recents() {
  const [mergedTrips, setMergedTrips] = useState<RecentTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const recentTrips = api.trips.getRecentTrips.useQuery();

  useEffect(() => {
    if (typeof window !== "undefined" && recentTrips.data) {
      setLoading(true);
      const sharedTrips = JSON.parse(
        localStorage.getItem("sharedTripsForUser") ?? "[]",
      ) as Array<{ id: string; name: string; createdAt: Date }>;

      const sharedTripsWithFlag = sharedTrips.map((trip) => ({
        ...trip,
        isShared: true,
      }));

      const mergedTrips = [...recentTrips.data, ...sharedTripsWithFlag];
      setMergedTrips(mergedTrips);
      setLoading(false);
    }
  }, [recentTrips.data]);

  return (
    <div className="mt-8 flex flex-col gap-4">
      {(recentTrips.isLoading || loading) && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      )}

      {/* Pagination? */}
      {mergedTrips.length !== 0 && !recentTrips.isLoading && !loading && (
        <>
          <h2 className="text-xl font-semibold">Your Recent Trips</h2>
          <div className="flex flex-col gap-2">
            {mergedTrips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trip/${trip.id}`}
                className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <div className="flex items-center gap-2">
                  <div className="font-medium">{trip.name}</div>
                  {trip.isShared && (
                    <div className="text-sm text-gray-500">Shared</div>
                  )}
                </div>
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
