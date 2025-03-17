import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

import { Header } from "~/components/header";

export default async function CreateTripLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <main>
      <Header />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="mb-12 text-center text-4xl font-bold text-gray-900 dark:text-zinc-300 sm:text-5xl">
          Where will your next adventure be?{" "}
          <span className="inline-block">🗺️</span>
        </h1>
        {children}
      </div>
    </main>
  );
}
