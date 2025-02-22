"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function CreateHeader() {
  const pathname = usePathname();
  const isAdvanced = pathname === "/create/advanced";

  return (
    <div className="mb-12 space-y-7 text-center">
      <h1 className="text-4xl font-bold sm:text-5xl">
        Where will your next adventure be?{" "}
        <span className="inline-block">🗺️</span>
      </h1>
      <p className="text-lg text-muted-foreground sm:text-xl">
        {isAdvanced ? (
          <>
            Fill out the form below with all details and let AI craft your
            perfect itinerary. Go back to{" "}
            <Link href="/create" className="text-primary underline">
              simple mode
            </Link>{" "}
            for a more laid-back experience.
          </>
        ) : (
          <>
            Tell us about your dream destination and let AI craft your perfect
            itinerary. Use the{" "}
            <Link href="/create/advanced" className="text-primary underline">
              advanced mode
            </Link>{" "}
            to provide detailed preferences upfront for a super personalized
            experience.
          </>
        )}
      </p>
    </div>
  );
}
