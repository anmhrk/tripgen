import Header from "@/components/header";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="flex flex-col items-center h-screen max-w-4xl mx-auto w-full px-4">
      <Header />
    </div>
  );
}
