import { createFileRoute, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/trip/$tripId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    console.log(params);
  },
});

function RouteComponent() {
  const { tripId } = useParams({ from: "/trip/$tripId" });
  return <div>Hello {tripId}</div>;
}
