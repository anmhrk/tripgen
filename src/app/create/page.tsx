import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import TripPrompt from "./_components/trip-prompt";

export default async function CreateTripPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-12 space-y-4 text-center">
        <h1 className="text-4xl font-bold sm:text-5xl">
          Where will your next adventure be?{" "}
          <span className="inline-block">🗺️</span>
        </h1>
        <p className="text-lg text-muted-foreground sm:text-xl">
          Tell us about your dream destination and let AI craft your perfect
          itinerary. Use the{" "}
          <Link href="/create/advanced" className="text-primary underline">
            advanced mode
          </Link>{" "}
          to provide detailed preferences upfront for a better experience.
        </p>
      </div>

      <TripPrompt />
    </div>
  );
}
