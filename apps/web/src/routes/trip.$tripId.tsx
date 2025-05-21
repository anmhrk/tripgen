import { createFileRoute, useParams } from "@tanstack/react-router";
import { orpc } from "../utils/orpc";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/trip/$tripId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { tripId } = useParams({ from: "/trip/$tripId" });
  const trip = useQuery(orpc.getTrip.queryOptions({ input: { tripId } }));

  if (trip.isLoading) {
    return <div>Loading...</div>;
  }

  if (trip.isError) {
    return <div>Error: {trip.error.message}</div>;
  }

  return <div>Hello {trip.data?.title}</div>;
}
