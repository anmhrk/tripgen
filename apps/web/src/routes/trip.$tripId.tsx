import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@tripgen/backend/_generated/api";
import { Loader2 } from "lucide-react";
import TripPageWrapper from "@/components/trip-page-wrapper";

export const Route = createFileRoute("/trip/$tripId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { tripId } = useParams({ from: "/trip/$tripId" });
  const trip = useQuery(api.functions.trip.getTrip, { tripId });

  if (trip === undefined) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="animate-spin size-10" />
      </div>
    );
  }

  if (!trip) {
    return <div>Trip not found</div>;
  }

  return <TripPageWrapper>This is trip {trip.title}</TripPageWrapper>;
}
