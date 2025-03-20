"use client";
import { api } from "~/trpc/react";
import Link from "next/link";
import { formatDistance } from "date-fns";
import { useEffect, useState } from "react";
import type { RecentTrip } from "~/lib/types";

import { Skeleton } from "~/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Recents() {
  const [mergedTrips, setMergedTrips] = useState<RecentTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastIdx, setLastIdx] = useState(5);
  const recentTrips = api.trips.getRecentTrips.useQuery();
  const session = useSession();

  useEffect(() => {
    if (typeof window !== "undefined" && recentTrips.data) {
      setLoading(true);
      const sharedTrips = JSON.parse(
        localStorage.getItem(`sharedTripsForUser-${session.data?.user.id}`) ??
          "[]",
      ) as Array<{ id: string; name: string; createdAt: Date }>;

      const sharedTripsWithFlag = sharedTrips.map((trip) => ({
        ...trip,
        isShared: true,
      }));

      const mergedTrips = [...recentTrips.data, ...sharedTripsWithFlag];
      mergedTrips.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      setMergedTrips(mergedTrips);
      setLoading(false);
    }
  }, [recentTrips.data, session]);

  return (
    <div className="mt-8 flex flex-col gap-4">
      {(recentTrips.isLoading || loading) && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      )}

      {mergedTrips.length !== 0 && !recentTrips.isLoading && !loading && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Recent Trips</h2>
            {5 < mergedTrips.length && (
              <div className="flex items-center gap-1">
                {lastIdx > 5 && (
                  <Button
                    onClick={() => setLastIdx(lastIdx - 5)}
                    className="p-0 px-1"
                    variant="ghost"
                  >
                    <ChevronLeft className="!h-6 !w-6" />
                  </Button>
                )}
                {lastIdx < mergedTrips.length && (
                  <Button
                    onClick={() => setLastIdx(lastIdx + 5)}
                    className="p-0 px-1"
                    variant="ghost"
                  >
                    <ChevronRight className="!h-6 !w-6" />
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {mergedTrips.slice(lastIdx - 5, lastIdx).map((trip, idx) => (
              <Link
                key={idx}
                href={`/trip/${trip.id}`}
                className="flex items-center justify-between rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <div className="flex items-center gap-2">
                  <div className="font-medium">{trip.name}</div>
                  {trip.isShared && (
                    <div className="text-sm text-gray-500">Shared</div>
                  )}
                </div>
                {trip.createdAt && (
                  <div className="text-sm text-gray-500">
                    {trip.isShared
                      ? "Joined"
                      : `Created ${formatDistance(
                          new Date(trip.createdAt),
                          new Date(),
                          {
                            addSuffix: true,
                          },
                        )}`}
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
