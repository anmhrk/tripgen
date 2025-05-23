import { createFileRoute, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/trip/$tripId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { tripId } = useParams({ from: "/trip/$tripId" });

  return <div>This is trip {tripId}</div>;
}
